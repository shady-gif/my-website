import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = url.pathname.replace(/^\/ppt\/api\/v1/, "/_ppt-api/v1");
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/ppt/api/v1/:path*"],
};
