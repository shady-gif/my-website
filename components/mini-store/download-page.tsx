import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Monitor,
  ShieldCheck,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { type MiniStoreAppSlug, miniStoreApps } from '@/lib/mini-store/apps';

type DownloadApp = (typeof miniStoreApps)[MiniStoreAppSlug];

export function MiniStoreDownloadPage({
  app,
  appSlug,
}: {
  app: DownloadApp;
  appSlug: MiniStoreAppSlug;
}) {
  return (
    <main className="min-h-svh bg-muted px-5 py-6 text-foreground md:px-10 md:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <Link
          href="/mini-store"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Mini Store
        </Link>

        <section className="grid gap-6 md:grid-cols-[minmax(0,1fr)_22rem]">
          <Card>
            <CardHeader>
              <CardDescription>{app.category}</CardDescription>
              <CardTitle className="text-3xl md:text-5xl">Download {app.name}</CardTitle>
              <p className="pt-2 text-base text-muted-foreground">{app.promise}</p>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Button asChild size="lg" className="h-14">
                <a href={`/api/mini-store/download/${appSlug}/windows`}>
                  <Monitor className="mr-2 size-4" />
                  Windows download
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14">
                <a href={`/api/mini-store/download/${appSlug}/mac`}>
                  <Download className="mr-2 size-4" />
                  Mac download
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ShieldCheck className="size-5" />
                Access approved
              </CardTitle>
              <CardDescription>Your download page is ready.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              This page is unlocked by a signed access session. Downloads are served through a
              protected route and recorded for support.
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
