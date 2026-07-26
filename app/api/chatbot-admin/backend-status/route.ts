import { NextResponse, type NextRequest } from "next/server";
import { getBackendStatus } from "@/lib/chatbot-admin/sources";
import { requireAdminRequest } from "@/lib/shadyy-security";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const adminError = requireAdminRequest(request);
  if (adminError) return adminError;

  return NextResponse.json({
    ok: true,
    status: await getBackendStatus(),
  });
}
