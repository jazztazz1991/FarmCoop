import { NotFoundError, ForbiddenError } from "@/domain/errors";
import { addInventorySchema, updatePriceSchema, purchaseSchema } from "./dealership.validator";
import * as repo from "./dealership.repository";
import * as bizRepo from "../business.repository";
import { prisma } from "@/lib/prisma";
import type { DealershipListingDTO, AddInventoryInput, PurchaseInput } from "./dealership.model";

function toDTO(row: {
  id: string;
  businessId: string;
  business: { name: string };
  itemId: string;
  itemName: string;
  category: string;
  quantity: number;
  pricePerUnit: bigint;
  status: string;
  createdAt: Date;
}): DealershipListingDTO {
  return {
    id: row.id,
    businessId: row.businessId,
    businessName: row.business.name,
    itemId: row.itemId,
    itemName: row.itemName,
    category: row.category,
    quantity: row.quantity,
    pricePerUnit: row.pricePerUnit.toString(),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function addItem(
  userId: string,
  businessId: string,
  input: AddInventoryInput
): Promise<DealershipListingDTO> {
  const parsed = addInventorySchema.parse(input);

  const business = await bizRepo.findBusinessById(businessId);
  if (!business) throw new NotFoundError("Dealership not found");
  if (business.type !== "dealership") throw new ForbiddenError("Not a dealership");
  if (business.ownerId !== userId) throw new ForbiddenError("Not the dealership owner");

  const item = await repo.addItem({
    businessId,
    itemId: parsed.itemId,
    itemName: parsed.itemName,
    category: parsed.category,
    quantity: parsed.quantity,
    pricePerUnit: BigInt(parsed.pricePerUnit),
  });

  return toDTO(item);
}

export async function getInventory(businessId: string): Promise<DealershipListingDTO[]> {
  const items = await repo.findInventory(businessId);
  return items.map(toDTO);
}

export async function updateItemPrice(
  userId: string,
  businessId: string,
  itemId: string,
  input: { pricePerUnit: string }
): Promise<DealershipListingDTO> {
  const parsed = updatePriceSchema.parse(input);

  const business = await bizRepo.findBusinessById(businessId);
  if (!business) throw new NotFoundError("Dealership not found");
  if (business.ownerId !== userId) throw new ForbiddenError("Not the dealership owner");

  const listing = await repo.findListingById(itemId);
  if (!listing || listing.businessId !== businessId) throw new NotFoundError("Item not found");

  const updated = await repo.updatePrice(itemId, BigInt(parsed.pricePerUnit));
  return toDTO(updated);
}

export async function removeItem(
  userId: string,
  businessId: string,
  itemId: string
): Promise<DealershipListingDTO> {
  const business = await bizRepo.findBusinessById(businessId);
  if (!business) throw new NotFoundError("Dealership not found");
  if (business.ownerId !== userId) throw new ForbiddenError("Not the dealership owner");

  const listing = await repo.findListingById(itemId);
  if (!listing || listing.businessId !== businessId) throw new NotFoundError("Item not found");

  const removed = await repo.removeItem(itemId);
  return toDTO(removed);
}

export async function purchaseItem(
  userId: string,
  businessId: string,
  itemId: string,
  input: PurchaseInput
): Promise<DealershipListingDTO> {
  const parsed = purchaseSchema.parse(input);

  const listing = await repo.findListingById(itemId);
  if (!listing || listing.businessId !== businessId) throw new NotFoundError("Item not found");
  if (listing.status !== "active") throw new ForbiddenError("Item no longer available");

  const business = await bizRepo.findBusinessById(businessId);
  if (!business) throw new NotFoundError("Dealership not found");

  // Get the farm to find the farmSlot
  const farm = await prisma.farm.findUnique({
    where: { id: parsed.recipientFarmId },
    select: { id: true, farmSlot: true, gameServerId: true },
  });
  if (!farm) throw new NotFoundError("Destination farm not found");

  const totalPrice = listing.pricePerUnit * BigInt(listing.quantity);

  const purchased = await repo.purchaseItem(
    itemId,
    businessId,
    userId,
    parsed.recipientFarmId,
    farm.gameServerId,
    totalPrice,
    listing.itemId,
    farm.farmSlot
  );

  return toDTO(purchased);
}

export async function browseDealerships(serverId?: string) {
  const businesses = await prisma.business.findMany({
    where: {
      type: "dealership",
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
