import { NextRequest, NextResponse } from "next/server";
import { isApiKeyAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Bridge-only endpoint: returns active servers with their transport configs.
 * Used by the bridge to create transports for each server.
 */
export async function GET(request: NextRequest) {
  if (!isApiKeyAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const servers = await prisma.gameServer.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      transportType: true,
      transportConfig: true,
    },
  });

  return NextResponse.json(servers);
}
