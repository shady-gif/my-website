import { NextResponse, type NextRequest } from "next/server";
import { createLeadCapture } from "@/lib/chatbot-admin/leads";
import {
  enforceRateLimit,
  preflightResponse,
  requireTenantAccess,
} from "@/lib/shadyy-security";

export const runtime = "nodejs";

const asText = (value: unknown, maxLength = 200) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

export async function OPTIONS(request: NextRequest) {
  return preflightResponse(request);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = asText(body.tenantId || body.pageContext?.tenantId || "shadyy", 80);
    const security = requireTenantAccess(request, tenantId);

    if (!security.ok) return security.response;

    const rate = enforceRateLimit(request, {
      keyPrefix: "lead",
      tenantId,
      limit: Number(process.env.SHADYY_LEAD_RATE_LIMIT ?? 10),
      windowMs: 10 * 60_000,
    });
    if (!rate.ok) return rate.response;

    const responseHeaders = { ...security.headers, ...rate.headers };

    const lead = await createLeadCapture({
      tenantId,
      chatId: body.chatId,
      name: body.name,
      contact: body.contact,
      productPage: body.productPage,
      budget: body.budget,
      interest: body.interest,
      objection: body.objection,
      conversationSummary: body.conversationSummary,
      pageContext: body.pageContext,
    });

    return NextResponse.json({ ok: true, lead }, { status: 201, headers: responseHeaders });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Lead capture failed.",
      },
      { status: 400 },
    );
  }
}
