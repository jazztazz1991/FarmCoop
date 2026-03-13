import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/health — public health check (no auth required) */
export async function GET() {
  let dbStatus: "ok" | "error" = "ok";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "error";
  }

  const healthy = dbStatus === "ok";

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      database: dbStatus,
    },
    { status: healthy ? 200 : 503 }
  );
}
