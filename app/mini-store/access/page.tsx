import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MiniStoreAccessGate } from '@/components/mini-store/access-gate';

export const metadata: Metadata = {
  title: 'Mini Store Access',
  description: 'Access your selected Shadyy Mini Store app.',
};

export default function MiniStoreAccessPage() {
  return (
    <Suspense>
      <MiniStoreAccessGate />
    </Suspense>
  );
}
