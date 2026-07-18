import { NextResponse, type NextRequest } from 'next/server';
import { isMiniStoreAppSlug } from '@/lib/mini-store/apps';
import {
  createMiniStoreSession,
  miniStoreSessionCookieName,
  verifyMiniStoreAccess,
} from '@/lib/mini-store/access';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    accessCode?: string;
    app?: string;
    identity?: string;
  };

  const identity = String(body.identity ?? '').trim().toLowerCase();
  const accessCode = String(body.accessCode ?? '').trim();
  const app = String(body.app ?? '').trim();

  if (!identity || !accessCode || !isMiniStoreAppSlug(app)) {
    return NextResponse.json(
      { ok: false, message: 'Enter valid access details.' },
      { status: 400 },
    );
  }

  let access: Awaited<ReturnType<typeof verifyMiniStoreAccess>>;

  try {
    access = await verifyMiniStoreAccess({ accessCode, app, identity });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: 'Access verification failed. Check Supabase setup.' },
      { status: 500 },
    );
  }

  if (!access.ok) {
    const message =
      access.reason === 'configuration'
        ? 'Access verification is not configured yet.'
        : access.reason === 'expired'
          ? 'This license has expired.'
          : access.reason === 'not_entitled'
            ? 'This license does not include this app.'
            : 'Access details did not match.';

    return NextResponse.json({ ok: false, message }, { status: 403 });
  }

  const response = NextResponse.json({
    ok: true,
    redirectTo: `/mini-store/download/${app}`,
  });

  response.cookies.set({
    name: miniStoreSessionCookieName,
    value: createMiniStoreSession({
      app,
      identity: access.identity,
      licenseId: access.licenseId,
    }),
    httpOnly: true,
    maxAge: 60 * 60 * 24,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
