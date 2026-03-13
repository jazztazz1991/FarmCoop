export interface GameServerDTO {
  id: string;
  name: string;
  transportType: string;
  isActive: boolean;
  createdAt: Date;
}

export interface CreateServerInput {
  name: string;
  transportType: "local" | "ftp";
  transportConfig: Record<string, unknown>;
}
