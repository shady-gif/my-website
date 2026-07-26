import { NextResponse, type NextRequest } from "next/server";
import { listLeadCaptures } from "@/lib/chatbot-admin/leads";
import { requireAdminRequest } from "@/lib/shadyy-security";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const adminError = requireAdminRequest(request);
  if (adminError) return adminError;

  const url = new URL(request.url);
  const tenantId = url.searchParams.get("tenantId")?.trim() || undefined;

  return NextResponse.json({
    ok: true,
    leads: await listLeadCaptures(tenantId),
  });
}
