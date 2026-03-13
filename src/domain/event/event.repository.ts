import { prisma } from "@/lib/prisma";

const eventSelect = {
  id: true,
  gameServerId: true,
  title: true,
  description: true,
  type: true,
  multiplier: true,
  startsAt: true,
  endsAt: true,
  isActive: true,
  createdAt: true,
} as const;

export async function createEvent(data: {
  gameServerId: string;
  title: string;
  description: string;
  type: string;
  multiplier: number;
  startsAt: Date;
  endsAt: Date;
}) {
  return prisma.event.create({
    data,
    select: eventSelect,
  });
}

export async function findActiveEvents(gameServerId: string) {
  const now = new Date();
  return prisma.event.findMany({
    where: {
      gameServerId,
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
    },
    select: eventSelect,
    orderBy: { startsAt: "desc" },
  });
}

export async function findUpcomingEvents(gameServerId: string) {
  const now = new Date();
  return prisma.event.findMany({
    where: {
      gameServerId,
      isActive: true,
      startsAt: { gt: now },
    },
    select: eventSelect,
    orderBy: { startsAt: "asc" },
  });
}

export async function findAllEvents(gameServerId: string) {
  return prisma.event.findMany({
    where: { gameServerId },
    select: eventSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function findEventById(id: string) {
  return prisma.event.findUnique({
    where: { id },
    select: eventSelect,
  });
}

export async function cancelEvent(id: string) {
  return prisma.event.update({
    where: { id },
    data: { isActive: false },
    select: eventSelect,
  });
}
