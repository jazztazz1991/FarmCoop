/**
 * Abstraction for reading/writing files to the game server's modSettings directory.
 * Local mode uses the filesystem directly; remote mode uses FTP/SFTP.
 */
export interface FileTransport {
  /** Write content to a file in the modSettings directory */
  writeFile(fileName: string, content: string): Promise<void>;

  /** Read content from a file in the modSettings directory. Returns null if file doesn't exist. */
  readFile(fileName: string): Promise<string | null>;

  /** Delete a file from the modSettings directory. No-op if file doesn't exist. */
  deleteFile(fileName: string): Promise<void>;

  /** Ensure the modSettings directory exists */
  ensureDirectory(): Promise<void>;

  /** Clean up any connections (e.g., close FTP client) */
  dispose(): Promise<void>;
}
