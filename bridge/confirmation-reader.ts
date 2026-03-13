import { XMLParser } from "fast-xml-parser";
import type { FileTransport } from "./transport";

export interface Confirmation {
  id: string;
  success: boolean;
  error?: string;
}

export async function readConfirmations(
  transport: FileTransport,
  fileName: string
): Promise<Confirmation[]> {
  const xml = await transport.readFile(fileName);

  if (xml === null) return [];

  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
  const parsed = parser.parse(xml);

  if (!parsed.confirmations?.confirmation) return [];

  const items = Array.isArray(parsed.confirmations.confirmation)
    ? parsed.confirmations.confirmation
    : [parsed.confirmations.confirmation];

  const confirmations: Confirmation[] = items.map(
    (item: { id: string; success: string; error?: string }) => ({
      id: item.id,
      success: item.success === "true",
      error: item.error,
    })
  );

  await transport.deleteFile(fileName);

  return confirmations;
}
