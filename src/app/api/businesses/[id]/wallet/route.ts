import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import {
  getBusinessWallet,
  getBusinessLedger,
} from "@/domain/business/business.service";

export const GET = withAuth(async (_request, { params }) => {
  const [wallet, ledger] = await Promise.all([
    getBusinessWallet(params.id),
    getBusinessLedger(params.id),
  ]);
  return NextResponse.json({ ...wallet, ledger });
});
