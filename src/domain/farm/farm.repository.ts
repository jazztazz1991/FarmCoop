import { prisma } from "@/lib/prisma";

const farmSelect = {
  id: true,
  gameServerId: true,
  userId: true,
  farmSlot: true,
  name: true,
  createdAt: true,
};

export async function createFarm(data: {
  gameServerId: string;
  userId: string;
  farmSlot: number;
  name: string;
}) {
  return prisma.farm.create({
    data,
    select: farmSelect,
  });
}

export async function findFarmsByServer(gameServerId: string) {
  return prisma.farm.findMany({
    where: { gameServerId },
    select: farmSelect,
    orderBy: { farmSlot: "asc" },
  });
}

export async function findFarmsByUser(userId: string) {
  return prisma.farm.findMany({
    where: { userId },
    select: farmSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function findFarmByServerAndSlot(
  gameServerId: string,
  farmSlot: number
) {
  return prisma.farm.findUnique({
    where: { gameServerId_farmSlot: { gameServerId, farmSlot } },
    select: farmSelect,
  });
}

export async function findFarmById(id: string) {
  return prisma.farm.findUnique({
    where: { id },
    select: farmSelect,
  });
}

export async function deleteFarm(id: string) {
  return prisma.farm.delete({
    where: { id },
  });
}
