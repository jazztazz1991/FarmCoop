import "dotenv/config";
import { loadConfig } from "./bridge.config";
import type { ServerConfig } from "./bridge.config";
import {
  fetchActiveServers,
  fetchPendingTransactions,
  updateTransactionStatus,
  creditWalletDeposit,
  groupByServer,
} from "./poller";
import type { PendingTransaction } from "./poller";
import { writeTransactionsFile } from "./file-writer";
import { readConfirmations } from "./confirmation-reader";
import { LocalTransport, FtpTransport } from "./transport";
import type { FileTransport } from "./transport";

const config = loadConfig();

// Transport cache: serverId → FileTransport
const transports = new Map<string, FileTransport>();

// Track wallet_deposit transactions for wallet credit on confirmation
const walletDepositTracker = new Map<string, PendingTransaction>();

function createTransportForServer(server: ServerConfig): FileTransport {
  const cfg = server.transportConfig as Record<string, unknown>;

  if (server.transportType === "ftp") {
    return new FtpTransport({
      host: String(cfg.host || ""),
      port: Number(cfg.port || 21),
      user: String(cfg.user || ""),
      password: String(cfg.password || ""),
      secure: Boolean(cfg.secure),
      remotePath: String(cfg.remotePath || ""),
    });
  }

  // Local transport
  return new LocalTransport(String(cfg.path || config.modSettingsPath));
}

function getOrCreateTransport(server: ServerConfig): FileTransport {
  let transport = transports.get(server.id);
  if (!transport) {
    transport = createTransportForServer(server);
    transports.set(server.id, transport);
    console.log(`  Transport created for "${server.name}" (${server.transportType})`);
  }
  return transport;
}

console.log("FarmCoop Bridge Service starting...");
console.log(`API: ${config.apiBaseUrl}`);
console.log(`Poll interval: ${config.pollIntervalMs}ms`);
console.log("Mode: multi-server");

async function poll() {
  try {
    // 1. Fetch active servers from API
    const servers = await fetchActiveServers(config);

    if (servers.length === 0) {
      return; // No servers registered yet
    }

    // 2. Fetch all pending transactions
    const allPending = await fetchPendingTransactions(config);

    if (allPending.length > 0) {
      console.log(`Found ${allPending.length} pending transaction(s)`);

      // Group by server
      const grouped = groupByServer(allPending);

      for (const [serverId, transactions] of grouped) {
        const server = servers.find((s) => s.id === serverId);
        if (!server) {
          console.log(`  [skip] No server config for ${serverId}`);
          continue;
        }

        const transport = getOrCreateTransport(server);

        // Write transactions XML to this server
        await writeTransactionsFile(
          transport,
          config.transactionsFileName,
          transactions
        );

        for (const tx of transactions) {
          try {
            if (tx.type === "wallet_deposit" && tx.senderId && tx.amount) {
              walletDepositTracker.set(tx.id, tx);
            }
            await updateTransactionStatus(config, tx.id, "delivered");
            console.log(`  [delivered] ${tx.id} (${tx.type}) → ${server.name}`);
          } catch (err) {
            console.error(`  [error] Failed to mark ${tx.id} as delivered:`, err);
          }
        }
      }
    }

    // 3. Read confirmations from each active server
    for (const server of servers) {
      const transport = transports.get(server.id);
      if (!transport) continue;

      const confirmations = await readConfirmations(
        transport,
        config.confirmationsFileName
      );

      if (confirmations.length > 0) {
        console.log(`Processing ${confirmations.length} confirmation(s) from "${server.name}"`);

        for (const conf of confirmations) {
          try {
            const status = conf.success ? "confirmed" : "failed";
            await updateTransactionStatus(config, conf.id, status);
            console.log(`  [${status}] ${conf.id}`);

            // Credit wallet for successful wallet_deposit
            if (conf.success && walletDepositTracker.has(conf.id)) {
              const depositTx = walletDepositTracker.get(conf.id)!;
              try {
                await creditWalletDeposit(
                  config,
                  depositTx.senderId!,
                  depositTx.id,
                  depositTx.amount!
                );
                console.log(`  [wallet-credited] ${conf.id} ($${depositTx.amount})`);
              } catch (err) {
                console.error(`  [error] Failed to credit wallet for ${conf.id}:`, err);
              }
              walletDepositTracker.delete(conf.id);
            }
          } catch (err) {
            console.error(`  [error] Failed to update confirmation for ${conf.id}:`, err);
          }
        }
      }
    }
  } catch (err) {
    console.error("Poll error:", err);
  }
}

// Graceful shutdown — close all transports
process.on("SIGINT", async () => {
  console.log("\nShutting down bridge...");
  for (const [, transport] of transports) {
    await transport.dispose();
  }
  process.exit(0);
});

setInterval(poll, config.pollIntervalMs);
poll();
