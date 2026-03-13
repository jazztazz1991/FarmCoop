import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getOpenContracts, createContract } from "@/domain/contract/contract.service";
import { ZodError } from "zod";

/** GET /api/servers/[id]/contracts — list open contracts for a server */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: gameServerId } = await params;
  const contracts = await getOpenContracts(gameServerId);
  return NextResponse.json(contracts);
}

/** POST /api/servers/[id]/contracts — create a new contract */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: gameServerId } = await params;

  try {
    const body = await request.json();
    const contract = await createContract(user.id, {
      ...body,
      gameServerId,
    });
    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Insufficient balance") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
