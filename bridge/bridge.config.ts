export interface BridgeConfig {
  apiBaseUrl: string;
  apiKey: string;
  pollIntervalMs: number;
  transactionsFileName: string;
  confirmationsFileName: string;
  /** Fallback for single-server mode (env-based config) */
  transport: "local" | "ftp";
  modSettingsPath: string;
  ftp: {
    host: string;
    port: number;
    user: string;
    password: string;
    secure: boolean;
    remotePath: string;
  };
}

export interface ServerConfig {
  id: string;
  name: string;
  transportType: string;
  transportConfig: Record<string, unknown>;
}

export function loadConfig(): BridgeConfig {
  const apiBaseUrl = process.env.BRIDGE_API_URL || "http://localhost:3000";
  const apiKey = process.env.API_KEY || "farmcoop-dev-key-change-in-production";
  const transport = (process.env.BRIDGE_TRANSPORT || "local") as "local" | "ftp";

  const modSettingsPath =
    process.env.BRIDGE_MOD_SETTINGS_PATH ||
    `${process.env.USERPROFILE || process.env.HOME}/Documents/My Games/FarmingSimulator2025/modSettings/FS25_FarmCoop`;

  return {
    apiBaseUrl,
    apiKey,
    pollIntervalMs: Number(process.env.BRIDGE_POLL_INTERVAL_MS) || 5000,
    transport,
    modSettingsPath,
    transactionsFileName: "pending_transactions.xml",
    confirmationsFileName: "confirmations.xml",
    ftp: {
      host: process.env.BRIDGE_FTP_HOST || "",
      port: Number(process.env.BRIDGE_FTP_PORT) || 21,
      user: process.env.BRIDGE_FTP_USER || "",
      password: process.env.BRIDGE_FTP_PASSWORD || "",
      secure: process.env.BRIDGE_FTP_SECURE === "true",
      remotePath:
        process.env.BRIDGE_FTP_REMOTE_PATH ||
        "/FarmingSimulator2025/modSettings/FS25_FarmCoop",
    },
  };
}
