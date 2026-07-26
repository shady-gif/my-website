import { NextResponse, type NextRequest } from "next/server";
import {
  getPublicTenantConfig,
  getTenantConfigByDomain,
} from "@/lib/shadyy-tenants";
import {
  enforceRateLimit,
  preflightResponse,
  requestOriginHost,
  tenantCorsHeaders,
} from "@/lib/shadyy-security";

export const runtime = "nodejs";

export async function OPTIONS(request: NextRequest) {
  return preflightResponse(request);
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tenantId = url.searchParams.get("tenant")?.trim() || "shadyy";
  const host =
    requestOriginHost(request) ||
    url.searchParams.get("host")?.trim() ||
    "";

  const tenant = getTenantConfigByDomain(host, tenantId);
  const headers = tenantCorsHeaders(request, tenant);

  if (!tenant || tenant.tenantId !== tenantId) {
    return NextResponse.json(
      { ok: false, message: "Tenant config is not available for this domain." },
      { status: 403, headers },
    );
  }

  const rate = enforceRateLimit(request, {
    keyPrefix: "widget-config",
    tenantId,
    limit: Number(process.env.SHADYY_WIDGET_CONFIG_RATE_LIMIT ?? 120),
    windowMs: 60_000,
  });
  if (!rate.ok) return rate.response;

  return NextResponse.json(
    { ok: true, config: getPublicTenantConfig(tenant) },
    { headers: { ...headers, ...rate.headers } },
  );
}
