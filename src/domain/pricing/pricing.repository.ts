import { prisma } from "@/lib/prisma";

const priceSelect = {
  id: true,
  gameServerId: true,
  commodityId: true,
  commodityName: true,
  basePrice: true,
  currentPrice: true,
  supply: true,
  demand: true,
  updatedAt: true,
} as const;

export async function upsertCommodityPrice(data: {
  gameServerId: string;
  commodityId: string;
  commodityName: string;
  basePrice: bigint;
  currentPrice: bigint;
}) {
  return prisma.commodityPrice.upsert({
    where: {
      gameServerId_commodityId: {
        gameServerId: data.gameServerId,
        commodityId: data.commodityId,
      },
    },
    create: {
      gameServerId: data.gameServerId,
      commodityId: data.commodityId,
      commodityName: data.commodityName,
      basePrice: data.basePrice,
      currentPrice: data.currentPrice,
    },
    update: {
      commodityName: data.commodityName,
      basePrice: data.basePrice,
      currentPrice: data.currentPrice,
    },
    select: priceSelect,
  });
}

export async function findPricesByServer(gameServerId: string) {
  return prisma.commodityPrice.findMany({
    where: { gameServerId },
    select: priceSelect,
    orderBy: { commodityName: "asc" },
  });
}

export async function findPrice(gameServerId: string, commodityId: string) {
  return prisma.commodityPrice.findUnique({
    where: {
      gameServerId_commodityId: { gameServerId, commodityId },
    },
    select: priceSelect,
  });
}

export async function updateSupplyDemand(
  gameServerId: string,
  commodityId: string,
  supply: number,
  demand: number,
  currentPrice: bigint
) {
  return prisma.commodityPrice.update({
    where: {
      gameServerId_commodityId: { gameServerId, commodityId },
    },
    data: { supply, demand, currentPrice },
    select: priceSelect,
  });
}

export async function recordPriceHistory(data: {
  gameServerId: string;
  commodityId: string;
  price: bigint;
  supply: number;
  demand: number;
}) {
  return prisma.priceHistory.create({
    data,
  });
}

export async function findPriceHistory(
  gameServerId: string,
  commodityId: string,
  limit = 100
) {
  return prisma.priceHistory.findMany({
    where: { gameServerId, commodityId },
    orderBy: { recordedAt: "desc" },
    take: limit,
    select: {
      price: true,
      supply: true,
      demand: true,
      recordedAt: true,
    },
  });
}
