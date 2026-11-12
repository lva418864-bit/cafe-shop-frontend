import type { Metadata } from 'next';
import { getPrivateRobotsDirective } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Add Product | Coffee Shop',
  robots: getPrivateRobotsDirective(),
};

export default function NewProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
