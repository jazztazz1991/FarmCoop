import { NotFoundError, ForbiddenError } from "@/domain/errors";
import { postDeliverySchema } from "./trucking.validator";
import * as repo from "./trucking.repository";
import * as bizRepo from "../business.repository";
import { prisma } from "@/lib/prisma";
import type { DeliveryContractDTO, PostDeliveryInput } from "./trucking.model";

type ContractRow = Awaited<ReturnType<typeof repo.findDeliveryById>>;

function toDTO(row: NonNullable<ContractRow>): DeliveryContractDTO {
  return {
    id: row.id,
    businessId: row.businessId,
    businessName: row.business.name,
    posterId: row.posterId,
    posterName: row.poster.displayName,
    serverName: row.destinationFarm.gameServer.name,
    farmName: row.destinationFarm.name,
    farmSlot: row.destinationFarm.farmSlot,
    itemDescription: row.itemDescription,
    payout: row.payout.toString(),
    status: row.status,
    acceptedAt: row.acceptedAt?.toISOString() ?? null,
    deliveredAt: row.deliveredAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function postDeliveryRequest(
  userId: string,
  businessId: string,
  input: PostDeliveryInput
): Promise<DeliveryContractDTO> {
  const parsed = postDeliverySchema.parse(input);

  const business = await bizRepo.findBusinessById(businessId);
  if (!business) throw new NotFoundError("Trucking company not found");
  if (business.type !== "trucking") throw new ForbiddenError("Not a trucking company");
  if (business.status !== "active") throw new ForbiddenError("Company is not active");

  // Get farm to determine gameServerId
  const farm = await prisma.farm.findUnique({
    where: { id: parsed.destinationFarmId },
    select: { id: true, gameServerId: true },
  });
  if (!farm) throw new NotFoundError("Destination farm not found");

  const contract = await repo.createDelivery(
    businessId,
    userId,
    farm.gameServerId,
    parsed.destinationFarmId,
    parsed.itemDescription,
    BigInt(parsed.payout)
  );

  return toDTO(contract);
}

export async function getDeliveries(
  userId: string,
  businessId: string
): Promise<DeliveryContractDTO[]> {
  const business = await bizRepo.findBusinessById(businessId);
  if (!business) throw new NotFoundError("Trucking company not found");

  const isOwner = business.ownerId === userId;
  const contracts = isOwner
    ? await repo.findDeliveriesByBusiness(businessId)
    : await repo.findDeliveriesByPoster(businessId, userId);

  return contracts.map(toDTO);
}

export async function acceptDelivery(
  userId: string,
  businessId: string,
  deliveryId: string
): Promise<DeliveryContractDTO> {
  const business = await bizRepo.findBusinessById(businessId);
  if (!business) throw new NotFoundError("Trucking company not found");
  if (business.ownerId !== userId) throw new ForbiddenError("Not the trucking company owner");

  const contract = await repo.findDeliveryById(deliveryId);
  if (!contract || contract.businessId !== businessId) throw new NotFoundError("Delivery not found");
  if (contract.status !== "open") throw new ForbiddenError("Delivery is not open");

  const updated = await repo.acceptDelivery(deliveryId);
  return toDTO(updated);
}

export async function markDelivered(
  userId: string,
  businessId: string,
  deliveryId: string
): Promise<DeliveryContractDTO> {
  const business = await bizRepo.findBusinessById(businessId);
  if (!business) throw new NotFoundError("Trucking company not found");
  if (business.ownerId !== userId) throw new ForbiddenError("Not the trucking company owner");

  const contract = await repo.findDeliveryById(deliveryId);
  if (!contract || contract.businessId !== businessId) throw new NotFoundError("Delivery not found");
  if (contract.status !== "accepted") throw new ForbiddenError("Delivery not accepted yet");

  const updated = await repo.markDelivered(deliveryId);
  return toDTO(updated);
}

export async function confirmDelivery(
  userId: string,
  businessId: string,
  deliveryId: string
): Promise<DeliveryContractDTO> {
  const contract = await repo.findDeliveryById(deliveryId);
  if (!contract || contract.businessId !== businessId) throw new NotFoundError("Delivery not found");
  if (contract.posterId !== userId) throw new ForbiddenError("Not the poster");
  if (contract.status !== "delivered") throw new ForbiddenError("Delivery not marked as delivered");

  const updated = await repo.confirmDelivery(deliveryId, businessId, contract.payout);
  return toDTO(updated);
}

export async function cancelDelivery(
  userId: string,
  businessId: string,
  deliveryId: string
): Promise<DeliveryContractDTO> {
  const contract = await repo.findDeliveryById(deliveryId);
  if (!contract || contract.businessId !== businessId) throw new NotFoundError("Delivery not found");

  // Poster can cancel if not yet accepted
  if (contract.posterId === userId && contract.status === "open") {
    const updated = await repo.cancelDelivery(deliveryId, contract.posterId, contract.payout);
    return toDTO(updated);
  }

  // Owner can cancel if accepted (refund to poster)
  const business = await bizRepo.findBusinessById(businessId);
  if (business && business.ownerId === userId && contract.status === "accepted") {
    const updated = await repo.cancelDelivery(deliveryId, contract.posterId, contract.payout);
    return toDTO(updated);
  }

  throw new ForbiddenError("Cannot cancel this delivery");
}

export async function browseTruckingCompanies(serverId?: string) {
  const businesses = await prisma.business.findMany({
    where: {
      type: "trucking",
      status: "active",
      ...(serverId ? { gameServerId: serverId } : {}),
    },
    select: {
      id: true,
      ownerId: true,
      owner: { select: { displayName: true } },
      gameServerId: true,
      gameServer: { select: { name: true } },
      type: true,
      name: true,
      description: true,
      status: true,
      settings: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return businesses.map((b) => ({
    id: b.id,
    ownerId: b.ownerId,
    ownerName: b.owner.displayName,
    gameServerId: b.gameServerId,
    serverName: b.gameServer.name,
    type: b.type,
    name: b.name,
    description: b.description,
    status: b.status,
    settings: b.settings,
    createdAt: b.createdAt.toISOString(),
  }));
}
