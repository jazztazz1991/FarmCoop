import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { LocalTransport } from "../transport";

describe("LocalTransport", () => {
  let tmpDir: string;
  let transport: LocalTransport;

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), "farmcoop-transport-")
    );
    transport = new LocalTransport(tmpDir);
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  it("writes and reads a file", async () => {
    await transport.writeFile("test.xml", "<root>hello</root>");
    const content = await transport.readFile("test.xml");
    expect(content).toBe("<root>hello</root>");
  });

  it("returns null for non-existent file", async () => {
    const content = await transport.readFile("missing.xml");
    expect(content).toBeNull();
  });

  it("deletes a file", async () => {
    await transport.writeFile("delete-me.xml", "data");
    await transport.deleteFile("delete-me.xml");
    const content = await transport.readFile("delete-me.xml");
    expect(content).toBeNull();
  });

  it("deleteFile is a no-op for non-existent file", async () => {
    await expect(transport.deleteFile("no-file.xml")).resolves.not.toThrow();
  });

  it("ensureDirectory creates nested directories", async () => {
    const nested = path.join(tmpDir, "a", "b", "c");
    const nestedTransport = new LocalTransport(nested);
    await nestedTransport.ensureDirectory();

    const stat = await fs.promises.stat(nested);
    expect(stat.isDirectory()).toBe(true);
  });

  it("dispose completes without error", async () => {
    await expect(transport.dispose()).resolves.not.toThrow();
  });
});
