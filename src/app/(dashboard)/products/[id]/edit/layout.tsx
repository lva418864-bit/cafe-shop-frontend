import type { Metadata } from 'next';
import { getPrivateRobotsDirective } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Edit Product | Coffee Shop',
  robots: getPrivateRobotsDirective(),
};

export default function EditProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
