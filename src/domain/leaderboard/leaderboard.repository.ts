import { prisma } from "@/lib/prisma";

/** Top users by wallet balance */
export async function findRichestUsers(limit = 10) {
  return prisma.wallet.findMany({
    orderBy: { balance: "desc" },
    take: limit,
    select: {
      balance: true,
      user: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          career: true,
        },
      },
    },
  });
}

/** Top users by number of marketplace purchases (listings bought) */
export async function findTopTraders(limit = 10) {
  // Count listings where user is the buyer and status is 'sold'
  const results = await prisma.listing.groupBy({
    by: ["buyerId"],
    where: { status: "sold", buyerId: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  if (results.length === 0) return [];

  const userIds = results.map((r) => r.buyerId!);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, displayName: true, avatarUrl: true, career: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return results.map((r) => ({
    user: userMap.get(r.buyerId!)!,
    count: r._count.id,
  }));
}

/** Top users by number of completed contracts (as claimer) */
export async function findTopContractors(limit = 10) {
  const results = await prisma.contract.groupBy({
    by: ["claimerId"],
    where: { status: "completed", claimerId: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  if (results.length === 0) return [];

  const userIds = results.map((r) => r.claimerId!);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, displayName: true, avatarUrl: true, career: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return results.map((r) => ({
    user: userMap.get(r.claimerId!)!,
    count: r._count.id,
  }));
}
