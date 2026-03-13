import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const userSelect = {
  id: true,
  discordId: true,
  displayName: true,
  avatarUrl: true,
  role: true,
  career: true,
  createdAt: true,
  updatedAt: true,
};

const sessionSelect = {
  id: true,
  userId: true,
  token: true,
  expiresAt: true,
  createdAt: true,
};

export async function findUserByDiscordId(discordId: string) {
  return prisma.user.findUnique({
    where: { discordId },
    select: userSelect,
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });
}

export async function upsertUserByDiscordId(
  discordId: string,
  displayName: string,
  avatarUrl: string | null
) {
  return prisma.user.upsert({
    where: { discordId },
    create: { discordId, displayName, avatarUrl },
    update: { displayName, avatarUrl },
    select: userSelect,
  });
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  return prisma.session.create({
    data: { userId, token, expiresAt },
    select: sessionSelect,
  });
}

export async function findSessionByToken(token: string) {
  return prisma.session.findUnique({
    where: { token },
    select: { ...sessionSelect, user: { select: userSelect } },
  });
}

export async function deleteSession(token: string) {
  return prisma.session.delete({
    where: { token },
  });
}

export async function deleteExpiredSessions() {
  return prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}
