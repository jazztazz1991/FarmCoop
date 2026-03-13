import type { FileTransport } from "./transport";
import type { PendingTransaction } from "./poller";

export function buildTransactionsXml(
  transactions: PendingTransaction[]
): string {
  const now = new Date().toISOString();
  const items = transactions
    .map((tx) => {
      const attrs = [
        `id="${tx.id}"`,
        `type="${tx.type}"`,
        `farmId="${tx.farmId}"`,
      ];
      if (tx.type === "money" && tx.amount !== null) {
        attrs.push(`amount="${tx.amount}"`);
      }
      if (tx.type === "equipment" && tx.equipmentId !== null) {
        attrs.push(`equipmentId="${tx.equipmentId}"`);
      }
      return `  <transaction ${attrs.join(" ")} />`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>\n<transactions writtenAt="${now}">\n${items}\n</transactions>\n`;
}

export async function writeTransactionsFile(
  transport: FileTransport,
  fileName: string,
  transactions: PendingTransaction[]
): Promise<void> {
  await transport.ensureDirectory();
  const xml = buildTransactionsXml(transactions);
  await transport.writeFile(fileName, xml);
}
