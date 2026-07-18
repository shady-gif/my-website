import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { MiniStoreDownloadPage } from '@/components/mini-store/download-page';
import { miniStoreApps, type MiniStoreAppSlug } from '@/lib/mini-store/apps';
import {
  miniStoreSessionCookieName,
  readMiniStoreSession,
} from '@/lib/mini-store/access';

export const dynamic = 'force-dynamic';

type DownloadPageProps = {
  params: Promise<{ app: string }>;
};

export async function generateMetadata({
  params,
}: DownloadPageProps): Promise<Metadata> {
  const { app } = await params;
  const downloadApp = miniStoreApps[app as MiniStoreAppSlug];

  if (!downloadApp) {
    return {
      title: 'Mini Store Download',
    };
  }

  return {
    title: `${downloadApp.name} Download`,
    description: `Download and install ${downloadApp.name} from Shadyy Mini Store.`,
  };
}

export function generateStaticParams() {
  return Object.keys(miniStoreApps).map((app) => ({ app }));
}

export default async function DownloadPage({ params }: DownloadPageProps) {
  const { app } = await params;
  const downloadApp = miniStoreApps[app as MiniStoreAppSlug];

  if (!downloadApp) {
    notFound();
  }

  const cookieStore = await cookies();
  const session = readMiniStoreSession(cookieStore.get(miniStoreSessionCookieName)?.value);

  if (!session || session.app !== app) {
    redirect(`/mini-store/access?app=${app}`);
  }

  return <MiniStoreDownloadPage app={downloadApp} appSlug={app} />;
}
