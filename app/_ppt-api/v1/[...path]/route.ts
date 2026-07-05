import { NextRequest } from "next/server";

const PRESENTON_BASE_URL = (
  process.env.PRESENTON_VERCEL_URL ||
  "https://presenton-vercel-worker.vercel.app"
).replace(/\/+$/, "");

async function forwardToPresenton(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const targetUrl = new URL(
    `/ppt/api/v1/${path.join("/")}${request.nextUrl.search}`,
    PRESENTON_BASE_URL
  );

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : request.body,
    duplex: "half",
    redirect: "manual",
    cache: "no-store",
  } as RequestInit & { duplex: "half" });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const GET = forwardToPresenton;
export const POST = forwardToPresenton;
export const PUT = forwardToPresenton;
export const PATCH = forwardToPresenton;
export const DELETE = forwardToPresenton;
export const OPTIONS = forwardToPresenton;
