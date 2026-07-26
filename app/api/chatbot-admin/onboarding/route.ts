import { NextResponse, type NextRequest } from "next/server";
import {
  listClientOnboardingSummaries,
  upsertClientOnboardingRecord,
} from "@/lib/chatbot-admin/onboarding";
import { requireAdminRequest } from "@/lib/shadyy-security";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const adminError = requireAdminRequest(request);
  if (adminError) return adminError;

  return NextResponse.json({
    ok: true,
    clients: await listClientOnboardingSummaries(),
  });
}

export async function POST(request: NextRequest) {
  const adminError = requireAdminRequest(request);
  if (adminError) return adminError;

  try {
    const body = await request.json();
    const client = await upsertClientOnboardingRecord(body);

    return NextResponse.json({ ok: true, client }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Client onboarding update failed.",
      },
      { status: 400 },
    );
  }
}
