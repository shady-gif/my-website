import type { Metadata } from 'next';
import { CodropsMiniStore } from '@/components/mini-store/codrops-mini-store';

export const metadata: Metadata = {
  title: 'Mini Store',
  description:
    'Browse Shadyy local business apps through an animated Mini Store preview experience.',
};

export default function MiniStorePage() {
  return <CodropsMiniStore />;
}
