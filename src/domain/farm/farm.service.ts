import type { FarmDTO } from "./farm.model";
import { claimFarmSchema } from "./farm.validator";
import * as farmRepo from "./farm.repository";
import * as serverRepo from "../server/server.repository";

export function toDTO(farm: {
  id: string;
  gameServerId: string;
  userId: string;
  farmSlot: number;
  name: string;
  createdAt: Date;
}): FarmDTO {
  return {
    id: farm.id,
    gameServerId: farm.gameServerId,
    userId: farm.userId,
    farmSlot: farm.farmSlot,
    name: farm.name,
    createdAt: farm.createdAt,
  };
}

export async function claimFarm(
  userId: string,
  gameServerId: string,
  input: { farmSlot: number; name: string }
): Promise<FarmDTO> {
  const parsed = claimFarmSchema.parse(input);

  const server = await serverRepo.findServerById(gameServerId);
  if (!server) throw new Error("Server not found");
  if (!server.isActive) throw new Error("Server is not active");

  const existing = await farmRepo.findFarmByServerAndSlot(
    gameServerId,
    parsed.farmSlot
  );
  if (existing) throw new Error("Farm slot already claimed");

  const farm = await farmRepo.createFarm({
    gameServerId,
    userId,
    farmSlot: parsed.farmSlot,
    name: parsed.name,
  });

  return toDTO(farm);
}

export async function releaseFarm(
  userId: string,
  farmId: string
): Promise<void> {
  const farm = await farmRepo.findFarmById(farmId);
  if (!farm) throw new Error("Farm not found");
  if (farm.userId !== userId) throw new Error("Not your farm");

  await farmRepo.deleteFarm(farmId);
}

export async function getMyFarms(userId: string): Promise<FarmDTO[]> {
  const farms = await farmRepo.findFarmsByUser(userId);
  return farms.map(toDTO);
}

export async function getServerFarms(
  gameServerId: string
): Promise<FarmDTO[]> {
  const farms = await farmRepo.findFarmsByServer(gameServerId);
  return farms.map(toDTO);
}
