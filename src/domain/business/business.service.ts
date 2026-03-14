import type {
  BusinessDTO,
  BusinessWalletDTO,
  BusinessLedgerEntryDTO,
  CreateBusinessInput,
  UpdateBusinessSettingsInput,
  BusinessType,
} from "./business.model";
import {
  createBusinessSchema,
  updateBusinessSettingsSchema,
  walletTransferSchema,
} from "./business.validator";
import { canCreateBusiness } from "./business.engine";
import * as repo from "./business.repository";
import { ForbiddenError, ConflictError, NotFoundError } from "@/domain/errors";

function toDTO(biz: {
  id: string;
  ownerId: string;
  gameServerId: string;
  type: string;
  name: string;
  description: string;
  status: string;
  settings: unknown;
  createdAt: Date;
  owner: { displayName: string };
  gameServer: { name: string };
}): BusinessDTO {
  return {
    id: biz.id,
    ownerId: biz.ownerId,
    ownerName: biz.owner.displayName,
    gameServerId: biz.gameServerId,
    serverName: biz.gameServer.name,
    type: biz.type as BusinessType,
    name: biz.name,
    description: biz.description,
    status: biz.status as "active" | "suspended" | "closed",
    settings: (biz.settings ?? {}) as Record<string, unknown>,
    createdAt: biz.createdAt,
  };
}

export async function createBusiness(
  userId: string,
  career: string,
  input: CreateBusinessInput
): Promise<BusinessDTO> {
  const parsed = createBusinessSchema.parse(input);

  if (!canCreateBusiness(career, parsed.type)) {
    throw new ForbiddenError(
      `Career "${career}" cannot create a ${parsed.type} business`
    );
  }

  const existing = await repo.findExistingBusiness(
    userId,
    parsed.gameServerId,
    parsed.type
  );
  if (existing) {
    throw new ConflictError(
      `You already have a ${parsed.type} business on this server`
    );
  }

  const business = await repo.createBusiness({
    ownerId: userId,
    gameServerId: parsed.gameServerId,
    type: parsed.type,
    name: parsed.name,
    description: parsed.description ?? "",
  });

  return toDTO(business);
}

export async function getMyBusinesses(userId: string): Promise<BusinessDTO[]> {
  const businesses = await repo.findBusinessesByOwner(userId);
  return businesses.map(toDTO);
}

export async function getBusiness(id: string): Promise<BusinessDTO> {
  const business = await repo.findBusinessById(id);
  if (!business) throw new NotFoundError("Business not found");
  return toDTO(business);
}

export async function browseBusinesses(filters: {
  type?: BusinessType;
  gameServerId?: string;
}): Promise<BusinessDTO[]> {
  const businesses = await repo.findBusinesses(filters);
  return businesses.map(toDTO);
}

export async function updateBusinessSettings(
  userId: string,
  businessId: string,
  input: UpdateBusinessSettingsInput
): Promise<BusinessDTO> {
  const business = await repo.findBusinessById(businessId);
  if (!business) throw new NotFoundError("Business not found");
  if (business.ownerId !== userId)
    throw new ForbiddenError("Not the business owner");

  const parsed = updateBusinessSettingsSchema.parse(input);
  const updated = await repo.updateBusiness(businessId, parsed);
  return toDTO(updated);
}

export async function closeBusiness(
  userId: string,
  businessId: string
): Promise<BusinessDTO> {
  const business = await repo.findBusinessById(businessId);
  if (!business) throw new NotFoundError("Business not found");
  if (business.ownerId !== userId)
    throw new ForbiddenError("Not the business owner");

  const updated = await repo.updateBusiness(businessId, { status: "closed" });
  return toDTO(updated);
}

export async function getBusinessWallet(
  businessId: string
): Promise<BusinessWalletDTO> {
  const wallet = await repo.getBusinessWallet(businessId);
  if (!wallet) throw new NotFoundError("Business wallet not found");
  return { balance: wallet.balance.toString() };
}

export async function getBusinessLedger(
  businessId: string
): Promise<BusinessLedgerEntryDTO[]> {
  const entries = await repo.getBusinessLedger(businessId);
  return entries.map((e) => ({
    id: e.id,
    amount: e.amount.toString(),
    type: e.type,
    description: e.description,
    createdAt: e.createdAt,
  }));
}

export async function depositToBusinessWallet(
  userId: string,
  businessId: string,
  amountStr: string
): Promise<void> {
  const { amount } = walletTransferSchema.parse({ amount: amountStr });
  const business = await repo.findBusinessById(businessId);
  if (!business) throw new NotFoundError("Business not found");
  if (business.ownerId !== userId)
    throw new ForbiddenError("Not the business owner");

  await repo.depositToBusinessWallet(businessId, userId, BigInt(amount));
}

export async function withdrawFromBusinessWallet(
  userId: string,
  businessId: string,
  amountStr: string
): Promise<void> {
  const { amount } = walletTransferSchema.parse({ amount: amountStr });
  const business = await repo.findBusinessById(businessId);
  if (!business) throw new NotFoundError("Business not found");
  if (business.ownerId !== userId)
    throw new ForbiddenError("Not the business owner");

  await repo.withdrawFromBusinessWallet(businessId, userId, BigInt(amount));
}
