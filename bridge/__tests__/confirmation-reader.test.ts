import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { readConfirmations } from "../confirmation-reader";
import { LocalTransport } from "../transport";

describe("readConfirmations", () => {
  let tmpDir: string;
  let transport: LocalTransport;

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), "farmcoop-test-")
    );
    transport = new LocalTransport(tmpDir);
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  it("returns empty array when file does not exist", async () => {
    const result = await readConfirmations(transport, "confirmations.xml");
    expect(result).toEqual([]);
  });

  it("parses single confirmation", async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<confirmations>
  <confirmation id="tx-1" success="true" />
</confirmations>`;

    await fs.promises.writeFile(
      path.join(tmpDir, "confirmations.xml"),
      xml,
      "utf-8"
    );

    const result = await readConfirmations(transport, "confirmations.xml");

    expect(result).toEqual([{ id: "tx-1", success: true }]);
  });

  it("parses multiple confirmations", async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<confirmations>
  <confirmation id="tx-1" success="true" />
  <confirmation id="tx-2" success="false" error="unknown_vehicle" />
</confirmations>`;

    await fs.promises.writeFile(
      path.join(tmpDir, "confirmations.xml"),
      xml,
      "utf-8"
    );

    const result = await readConfirmations(transport, "confirmations.xml");

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: "tx-1", success: true });
    expect(result[1]).toEqual({
      id: "tx-2",
      success: false,
      error: "unknown_vehicle",
    });
  });

  it("deletes the file after reading", async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<confirmations>
  <confirmation id="tx-1" success="true" />
</confirmations>`;

    const filePath = path.join(tmpDir, "confirmations.xml");
    await fs.promises.writeFile(filePath, xml, "utf-8");

    await readConfirmations(transport, "confirmations.xml");

    await expect(fs.promises.access(filePath)).rejects.toThrow();
  });
});
