import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { miniStoreApps, isMiniStoreAppSlug, isMiniStorePlatform } from '@/lib/mini-store/apps';
import {
  logMiniStoreDownload,
  miniStoreSessionCookieName,
  readMiniStoreSession,
} from '@/lib/mini-store/access';

export const runtime = 'nodejs';

type DownloadRouteContext = {
  params: Promise<{
    app: string;
    platform: string;
  }>;
};

const contentTypes = {
  mac: 'application/x-apple-diskimage',
  windows: 'application/zip',
};

export async function GET(request: NextRequest, context: DownloadRouteContext) {
  const { app, platform } = await context.params;

  if (!isMiniStoreAppSlug(app) || !isMiniStorePlatform(platform)) {
    return NextResponse.json({ ok: false, message: 'Download not found.' }, { status: 404 });
  }

  const session = readMiniStoreSession(
    request.cookies.get(miniStoreSessionCookieName)?.value,
  );

  if (!session || session.app !== app) {
    return NextResponse.json({ ok: false, message: 'Access required.' }, { status: 401 });
  }

  const fileName = miniStoreApps[app].packages[platform];
  const filePath = path.join(process.cwd(), 'public', 'downloads', fileName);
  const file = await readFile(filePath);

  await logMiniStoreDownload({
    app,
    identity: session.identity,
    licenseId: session.licenseId,
    platform,
  });

  return new NextResponse(file, {
    headers: {
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': String(file.byteLength),
      'Content-Type': contentTypes[platform],
    },
  });
}
