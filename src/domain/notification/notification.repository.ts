import { prisma } from "@/lib/prisma";

const notificationSelect = {
  id: true,
  userId: true,
  type: true,
  title: true,
  message: true,
  referenceId: true,
  read: true,
  createdAt: true,
} as const;

export async function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  referenceId?: string;
}) {
  return prisma.notification.create({
    data,
    select: notificationSelect,
  });
}

export async function findByUser(userId: string, limit = 50) {
  return prisma.notification.findMany({
    where: { userId },
    select: notificationSelect,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function countUnread(userId: string) {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}

export async function markAsRead(id: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
