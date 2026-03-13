import { prisma } from "@/lib/prisma";

const userSelect = {
  id: true,
  displayName: true,
  avatarUrl: true,
  role: true,
  career: true,
};

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });
}

export async function updateUser(id: string, data: { displayName?: string; career?: string }) {
  return prisma.user.update({
    where: { id },
    data,
    select: userSelect,
  });
}
