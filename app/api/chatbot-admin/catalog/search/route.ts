import { NextResponse, type NextRequest } from "next/server";
import {
  searchProductCatalog,
  type ProductCatalogFilters,
} from "@/lib/chatbot-admin/sources";
import { requireAdminRequest } from "@/lib/shadyy-security";

export const runtime = "nodejs";

const asNumber = (value: string | null) => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export async function GET(request: NextRequest) {
  const adminError = requireAdminRequest(request);
  if (adminError) return adminError;

  const url = new URL(request.url);
  const tenantId = url.searchParams.get("tenantId")?.trim() || "shadyy";
  const query = url.searchParams.get("q")?.trim() || "";
  const filters: ProductCatalogFilters = {
    category: url.searchParams.get("category")?.trim() || undefined,
    brand: url.searchParams.get("brand")?.trim() || undefined,
    size: url.searchParams.get("size")?.trim() || undefined,
    availability: url.searchParams.get("availability")?.trim() || undefined,
    productUrl: url.searchParams.get("productUrl")?.trim() || undefined,
    minPrice: asNumber(url.searchParams.get("minPrice")),
    maxPrice: asNumber(url.searchParams.get("maxPrice")),
  };
  const limit = asNumber(url.searchParams.get("limit")) ?? 5;

  try {
    const result = await searchProductCatalog({
      tenantId,
      query,
      filters,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Catalog search failed.",
        products: [],
      },
      { status: 500 },
    );
  }
}
