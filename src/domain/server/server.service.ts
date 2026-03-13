import type { GameServerDTO, CreateServerInput } from "./server.model";
import { createServerSchema } from "./server.validator";
import * as serverRepo from "./server.repository";

export function toDTO(server: {
  id: string;
  name: string;
  transportType: string;
  isActive: boolean;
  createdAt: Date;
}): GameServerDTO {
  return {
    id: server.id,
    name: server.name,
    transportType: server.transportType,
    isActive: server.isActive,
    createdAt: server.createdAt,
  };
}

export async function registerServer(
  input: CreateServerInput
): Promise<GameServerDTO> {
  const parsed = createServerSchema.parse(input);
  const server = await serverRepo.createServer({
    ...parsed,
    transportConfig: parsed.transportConfig as Record<string, string>,
  });
  return toDTO(server);
}

export async function listActiveServers(): Promise<GameServerDTO[]> {
  const servers = await serverRepo.findActiveServers();
  return servers.map(toDTO);
}

export async function getServer(id: string): Promise<GameServerDTO | null> {
  const server = await serverRepo.findServerById(id);
  if (!server) return null;
  return toDTO(server);
}
