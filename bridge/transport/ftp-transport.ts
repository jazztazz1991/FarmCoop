import * as ftp from "basic-ftp";
import { Readable, Writable } from "stream";
import type { FileTransport } from "./transport";

export interface FtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  secure: boolean;
  /** Remote path to modSettings/FS25_FarmCoop/ on the game server */
  remotePath: string;
}

export class FtpTransport implements FileTransport {
  private client: ftp.Client;
  private connected = false;

  constructor(private readonly config: FtpConfig) {
    this.client = new ftp.Client();
  }

  private async connect(): Promise<void> {
    if (this.connected) return;

    await this.client.access({
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      secure: this.config.secure,
    });

    this.connected = true;
  }

  async writeFile(fileName: string, content: string): Promise<void> {
    await this.connect();

    const remotePath = this.joinPath(fileName);
    const stream = Readable.from(Buffer.from(content, "utf-8"));
    await this.client.uploadFrom(stream, remotePath);
  }

  async readFile(fileName: string): Promise<string | null> {
    await this.connect();

    const remotePath = this.joinPath(fileName);
    const chunks: Buffer[] = [];

    const writable = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        callback();
      },
    });

    try {
      await this.client.downloadTo(writable, remotePath);
      return Buffer.concat(chunks).toString("utf-8");
    } catch (err: unknown) {
      const ftpErr = err as { code?: number };
      // 550 = file not found on most FTP servers
      if (ftpErr.code === 550) return null;
      throw err;
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    await this.connect();

    const remotePath = this.joinPath(fileName);
    try {
      await this.client.remove(remotePath);
    } catch (err: unknown) {
      const ftpErr = err as { code?: number };
      if (ftpErr.code === 550) return; // File doesn't exist
      throw err;
    }
  }

  async ensureDirectory(): Promise<void> {
    await this.connect();
    await this.client.ensureDir(this.config.remotePath);
  }

  async dispose(): Promise<void> {
    if (this.connected) {
      this.client.close();
      this.connected = false;
    }
  }

  private joinPath(fileName: string): string {
    const base = this.config.remotePath.endsWith("/")
      ? this.config.remotePath
      : this.config.remotePath + "/";
    return base + fileName;
  }
}
