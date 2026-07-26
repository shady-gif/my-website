import { NextResponse, type NextRequest } from "next/server";
import { getConversationAnalyticsSummary } from "@/lib/chatbot-admin/analytics";
import { requireAdminRequest } from "@/lib/shadyy-security";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const adminError = requireAdminRequest(request);
  if (adminError) return adminError;

  const url = new URL(request.url);
  const tenantId = url.searchParams.get("tenantId")?.trim() || "shadyy";

  return NextResponse.json({
    ok: true,
    analytics: await getConversationAnalyticsSummary(tenantId),
  });
}
