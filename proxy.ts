import { NextResponse, type NextRequest, userAgent } from "next/server";

const MOBILE_SITE_ORIGIN = "https://scroll-based-layout-animations-six.vercel.app";
const MOBILE_ASSET_PREFIXES = ["/css/", "/img/", "/js/"];
const MOBILE_ASSET_PATHS = new Set(["/favicon.ico", "/image-1.png"]);

function getMobileSitePath(pathname: string) {
  if (
    MOBILE_ASSET_PATHS.has(pathname) ||
    MOBILE_ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return pathname;
  }

  return "/";
}

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/downloads/")) {
    return new NextResponse("Access required", { status: 404 });
  }

  const { device, isBot } = userAgent(request);
  const isMobileVisitor = device.type === "mobile" || device.type === "tablet";

  if (!isMobileVisitor || isBot) {
    return NextResponse.next();
  }

  const destination = new URL(
    getMobileSitePath(request.nextUrl.pathname),
    MOBILE_SITE_ORIGIN,
  );
  destination.search = request.nextUrl.search;

  return NextResponse.rewrite(destination);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|api|ppt|prompt-to-website).*)",
  ],
};
