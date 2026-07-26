import { NextResponse, type NextRequest } from "next/server";
import {
  createChatbotSource,
  listChatbotSources,
  type ChatbotSourceKind,
} from "@/lib/chatbot-admin/sources";
import { requireAdminRequest } from "@/lib/shadyy-security";

export const runtime = "nodejs";

const isSourceKind = (value: FormDataEntryValue | null): value is ChatbotSourceKind =>
  value === "document" || value === "catalog";

export async function GET(request: NextRequest) {
  const adminError = requireAdminRequest(request);
  if (adminError) return adminError;

  const url = new URL(request.url);
  const tenantId = url.searchParams.get("tenantId")?.trim() || undefined;

  return NextResponse.json({
    ok: true,
    sources: await listChatbotSources(tenantId),
  });
}

export async function POST(request: NextRequest) {
  const adminError = requireAdminRequest(request);
  if (adminError) return adminError;

  try {
    const formData = await request.formData();
    const tenantId = String(formData.get("tenantId") || "shadyy").trim();
    const kind = formData.get("kind");
    const file = formData.get("file");

    if (!isSourceKind(kind)) {
      return NextResponse.json(
        { ok: false, message: "Choose document or catalog upload type." },
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, message: "Upload a file." },
        { status: 400 },
      );
    }

    const source = await createChatbotSource({
      tenantId,
      kind,
      file,
    });

    return NextResponse.json({ ok: true, source }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Upload failed.",
      },
      { status: 400 },
    );
  }
}
