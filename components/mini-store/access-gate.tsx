'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GalleryVerticalEndIcon } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { miniStoreApps } from '@/lib/mini-store/apps';

type AccessStatus = 'idle' | 'success' | 'error';

export function MiniStoreAccessGate({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<AccessStatus>('idle');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const appSlug = useMemo(() => {
    const requestedApp = searchParams.get('app') ?? 'mautic';
    return requestedApp in miniStoreApps ? requestedApp : 'mautic';
  }, [searchParams]);

  const appName = miniStoreApps[appSlug as keyof typeof miniStoreApps].name;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    const formData = new FormData(event.currentTarget);
    const identity = String(formData.get('identity') ?? '').trim().toLowerCase();
    const accessCode = String(formData.get('accessCode') ?? '').trim();

    const response = await fetch('/api/mini-store/access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessCode,
        app: appSlug,
        identity,
      }),
    });
    const result = (await response.json()) as {
      message?: string;
      ok: boolean;
      redirectTo?: string;
    };

    if (response.ok && result.ok && result.redirectTo) {
      const redirectTo = result.redirectTo;
      setStatus('success');
      setMessage('Access approved. Opening download page.');
      window.setTimeout(() => {
        router.push(redirectTo);
      }, 700);
      return;
    }

    setMessage(result.message ?? 'Access details did not match.');
    setStatus('error');
    setIsSubmitting(false);
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className={cn('flex w-full max-w-sm flex-col gap-6', className)} {...props}>
        <Link href="/mini-store" className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEndIcon className="size-4" />
          </div>
          Mini Store
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Access {appName}</CardTitle>
            <CardDescription>Continue with your Shadyy access details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="identity">Email or username</Label>
                  <Input
                    id="identity"
                    name="identity"
                    autoComplete="username"
                    placeholder="you@company.com"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="accessCode">Password or access code</Label>
                  <Input
                    id="accessCode"
                    name="accessCode"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </div>

                {status === 'error' ? (
                  <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                    {message}
                  </p>
                ) : null}

                {status === 'success' ? (
                  <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-700">
                    {message}
                  </p>
                ) : null}

                <Button type="submit" disabled={status === 'success' || isSubmitting}>
                  {isSubmitting ? 'Checking access...' : 'Get access'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
