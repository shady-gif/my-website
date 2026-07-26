import { NextResponse, type NextRequest } from "next/server";
import { revenueEngineQaSummary } from "@/lib/revenue-engine/qa-scenarios";
import { requireAdminRequest } from "@/lib/shadyy-security";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const adminError = requireAdminRequest(request);
  if (adminError) return adminError;

  const summary = revenueEngineQaSummary();

  return NextResponse.json({
    ok: summary.failed === 0,
    qa: summary,
  });
}
