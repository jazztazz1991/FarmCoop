import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";

export const GET = withAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const serverId = searchParams.get("serverId");

  const insurers = await prisma.business.findMany({
    where: {
      type: "insurance",
      status: "active",
      ...(serverId ? { gameServerId: serverId } : {}),
    },
    select: {
      id: true,
      ownerId: true,
      owner: { select: { displayName: true } },
      gameServerId: true,
      gameServer: { select: { name: true } },
      type: true,
      name: true,
      description: true,
      status: true,
      settings: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    insurers.map((b) => ({
      id: b.id,
      ownerId: b.ownerId,
      ownerName: b.owner.displayName,
      gameServerId: b.gameServerId,
      serverName: b.gameServer.name,
      type: b.type,
      name: b.name,
      description: b.description,
      status: b.status,
      settings: b.settings,
      createdAt: b.createdAt.toISOString(),
    }))
  );
});
