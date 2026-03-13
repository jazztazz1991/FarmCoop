import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getRecipes } from "@/domain/production/production.service";

/** GET /api/recipes — list all available recipes */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recipes = await getRecipes();
  return NextResponse.json(recipes);
}
