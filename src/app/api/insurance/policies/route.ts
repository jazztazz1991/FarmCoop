import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getMyPolicies, purchasePolicy } from "@/domain/insurance/insurance.service";

/** GET /api/insurance/policies — list my policies */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const policies = await getMyPolicies(user.id);
  return NextResponse.json(policies);
}

/** POST /api/insurance/policies — purchase a policy */
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const policy = await purchasePolicy(user.id, body);
    return NextResponse.json(policy, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
