import type { ContractDTO, CreateContractInput } from "./contract.model";
import { createContractSchema } from "./contract.validator";
import * as contractRepo from "./contract.repository";
import { notify } from "../notification/notification.service";
import { recalculate } from "../pricing/pricing.service";

type RepoContract = Awaited<ReturnType<typeof contractRepo.findOpenContracts>>[number];

export function toDTO(c: RepoContract): ContractDTO {
  return {
    id: c.id,
    gameServerId: c.gameServerId,
    posterId: c.posterId,
    posterName: c.poster.displayName,
    claimerId: c.claimerId,
    claimerName: c.claimer?.displayName ?? null,
    commodityId: c.commodityId,
    commodityName: c.commodityName,
    quantity: c.quantity,
    pricePerUnit: c.pricePerUnit.toString(),
    totalPayout: c.totalPayout.toString(),
    status: c.status,
    expiresAt: c.expiresAt.toISOString(),
    deliveryDeadline: c.deliveryDeadline?.toISOString() ?? null,
    claimedAt: c.claimedAt?.toISOString() ?? null,
    deliveredAt: c.deliveredAt?.toISOString() ?? null,
    completedAt: c.completedAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
  };
}

const DELIVERY_DEADLINE_HOURS = 48;

/** Create a new contract with escrow from poster's wallet */
export async function createContract(
  posterId: string,
  input: CreateContractInput
): Promise<ContractDTO> {
  const parsed = createContractSchema.parse(input);
  const pricePerUnit = BigInt(parsed.pricePerUnit);
  const totalPayout = pricePerUnit * BigInt(parsed.quantity);

  const contract = await contractRepo.createContractWithEscrow({
    gameServerId: parsed.gameServerId,
    posterId,
    commodityId: parsed.commodityId,
    commodityName: parsed.commodityName,
    quantity: parsed.quantity,
    pricePerUnit,
    totalPayout,
    expiresAt: new Date(parsed.expiresAt),
  });

  // Contract creation signals demand — fire-and-forget price recalculation
  recalculate(parsed.gameServerId, parsed.commodityId, 0, parsed.quantity).catch(() => {});

  return toDTO(contract);
}

/** List open contracts for a server */
export async function getOpenContracts(gameServerId: string): Promise<ContractDTO[]> {
  const contracts = await contractRepo.findOpenContracts(gameServerId);
  return contracts.map(toDTO);
}

/** Get a single contract by ID */
export async function getContract(id: string): Promise<ContractDTO | null> {
  const contract = await contractRepo.findContractById(id);
  return contract ? toDTO(contract) : null;
}

/** Get contracts posted by a user */
export async function getMyPostedContracts(posterId: string): Promise<ContractDTO[]> {
  const contracts = await contractRepo.findContractsByPoster(posterId);
  return contracts.map(toDTO);
}

/** Get contracts claimed by a user */
export async function getMyClaimedContracts(claimerId: string): Promise<ContractDTO[]> {
  const contracts = await contractRepo.findContractsByClaimer(claimerId);
  return contracts.map(toDTO);
}

/** Claim an open contract */
export async function claimContract(
  contractId: string,
  claimerId: string
): Promise<ContractDTO> {
  const existing = await contractRepo.findContractById(contractId);
  if (!existing) throw new Error("Contract not found");
  if (existing.status !== "open") throw new Error("Contract is not open");
  if (existing.posterId === claimerId) throw new Error("Cannot claim your own contract");
  if (existing.expiresAt < new Date()) throw new Error("Contract has expired");

  const deliveryDeadline = new Date();
  deliveryDeadline.setHours(deliveryDeadline.getHours() + DELIVERY_DEADLINE_HOURS);

  const updated = await contractRepo.claimContract(contractId, claimerId, deliveryDeadline);

  notify({
    userId: existing.posterId,
    type: "contract_claimed",
    title: "Contract Claimed",
    message: `Your contract for ${existing.commodityName} x${existing.quantity} has been claimed`,
    referenceId: contractId,
  }).catch(() => {});

  return toDTO(updated);
}

/** Mark a contract as delivered (claimer action) */
export async function deliverContract(
  contractId: string,
  claimerId: string
): Promise<ContractDTO> {
  const existing = await contractRepo.findContractById(contractId);
  if (!existing) throw new Error("Contract not found");
  if (existing.status !== "claimed") throw new Error("Contract is not claimed");
  if (existing.claimerId !== claimerId) throw new Error("Only the claimer can deliver");

  const updated = await contractRepo.markDelivered(contractId);

  notify({
    userId: existing.posterId,
    type: "contract_delivered",
    title: "Delivery Received",
    message: `Delivery for ${existing.commodityName} x${existing.quantity} has been submitted`,
    referenceId: contractId,
  }).catch(() => {});

  return toDTO(updated);
}

/** Complete a contract — poster confirms delivery, escrow released to claimer */
export async function completeContract(
  contractId: string,
  posterId: string
): Promise<ContractDTO> {
  const existing = await contractRepo.findContractById(contractId);
  if (!existing) throw new Error("Contract not found");
  if (existing.status !== "delivered") throw new Error("Contract has not been delivered");
  if (existing.posterId !== posterId) throw new Error("Only the poster can complete");

  const updated = await contractRepo.completeContractWithPayout(
    contractId,
    existing.claimerId!,
    existing.totalPayout,
    existing.commodityName,
    existing.quantity
  );

  notify({
    userId: existing.claimerId!,
    type: "contract_completed",
    title: "Contract Completed",
    message: `You received ${existing.totalPayout.toString()} for delivering ${existing.commodityName} x${existing.quantity}`,
    referenceId: contractId,
  }).catch(() => {});

  // Completion signals supply increase — fire-and-forget price recalculation
  recalculate(existing.gameServerId, existing.commodityId, existing.quantity, 0).catch(() => {});

  return toDTO(updated);
}

/** Cancel an open or claimed contract — refund escrow to poster */
export async function cancelContract(
  contractId: string,
  userId: string
): Promise<ContractDTO> {
  const existing = await contractRepo.findContractById(contractId);
  if (!existing) throw new Error("Contract not found");
  if (existing.posterId !== userId) throw new Error("Only the poster can cancel");
  if (existing.status !== "open" && existing.status !== "claimed") {
    throw new Error("Contract cannot be cancelled in current status");
  }

  const updated = await contractRepo.cancelContractWithRefund(
    contractId,
    existing.posterId,
    existing.totalPayout,
    existing.commodityName,
    existing.quantity
  );

  if (existing.claimerId) {
    notify({
      userId: existing.claimerId,
      type: "contract_cancelled",
      title: "Contract Cancelled",
      message: `Contract for ${existing.commodityName} x${existing.quantity} was cancelled by the poster`,
      referenceId: contractId,
    }).catch(() => {});
  }

  return toDTO(updated);
}

/** Expire open contracts past their expiration date and refund escrow */
export async function expireContracts(): Promise<number> {
  const expired = await contractRepo.expireContracts();
  let count = 0;

  for (const c of expired) {
    await contractRepo.cancelContractWithRefund(
      c.id,
      c.posterId,
      c.totalPayout,
      c.commodityName,
      c.quantity
    );
    count++;
  }

  return count;
}
