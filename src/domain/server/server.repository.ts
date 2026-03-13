import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const serverSelectPublic = {
  id: true,
  name: true,
  transportType: true,
  isActive: true,
  createdAt: true,
};

const serverSelectFull = {
  ...serverSelectPublic,
  transportConfig: true,
};

export async function createServer(data: {
  name: string;
  transportType: string;
  transportConfig: Prisma.InputJsonValue;
}) {
  return prisma.gameServer.create({
    data,
    select: serverSelectPublic,
  });
}

export async function findActiveServers() {
  return prisma.gameServer.findMany({
    where: { isActive: true },
    select: serverSelectPublic,
    orderBy: { createdAt: "asc" },
  });
}

export async function findServerById(id: string) {
  return prisma.gameServer.findUnique({
    where: { id },
    select: serverSelectPublic,
  });
}

export async function findServerByIdWithConfig(id: string) {
  return prisma.gameServer.findUnique({
    where: { id },
    select: serverSelectFull,
  });
}

export async function updateServer(
  id: string,
  data: { name?: string; isActive?: boolean; transportConfig?: Prisma.InputJsonValue }
) {
  return prisma.gameServer.update({
    where: { id },
    data,
    select: serverSelectPublic,
  });
}
