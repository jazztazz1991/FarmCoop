import * as fs from "fs";
import * as path from "path";
import type { FileTransport } from "./transport";

export class LocalTransport implements FileTransport {
  constructor(private readonly basePath: string) {}

  async writeFile(fileName: string, content: string): Promise<void> {
    const filePath = path.join(this.basePath, fileName);
    await fs.promises.writeFile(filePath, content, "utf-8");
  }

  async readFile(fileName: string): Promise<string | null> {
    const filePath = path.join(this.basePath, fileName);
    try {
      await fs.promises.access(filePath);
      return await fs.promises.readFile(filePath, "utf-8");
    } catch {
      return null;
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    const filePath = path.join(this.basePath, fileName);
    try {
      await fs.promises.unlink(filePath);
    } catch {
      // File doesn't exist — no-op
    }
  }

  async ensureDirectory(): Promise<void> {
    await fs.promises.mkdir(this.basePath, { recursive: true });
  }

  async dispose(): Promise<void> {
    // Nothing to clean up for local filesystem
  }
}
