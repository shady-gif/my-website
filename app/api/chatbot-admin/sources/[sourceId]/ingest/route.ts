import { NextResponse, type NextRequest } from "next/server";
import { ingestChatbotSource } from "@/lib/chatbot-admin/sources";
import { requireAdminRequest } from "@/lib/shadyy-security";

export const runtime = "nodejs";

type IngestRouteContext = {
  params: Promise<{
    sourceId: string;
  }>;
};

export async function POST(request: NextRequest, context: IngestRouteContext) {
  const adminError = requireAdminRequest(request);
  if (adminError) return adminError;

  const { sourceId } = await context.params;
  const source = await ingestChatbotSource(sourceId);

  if (!source) {
    return NextResponse.json(
      { ok: false, message: "Source not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, source });
}
