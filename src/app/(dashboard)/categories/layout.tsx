import type { Metadata } from 'next';
import { getPrivateRobotsDirective } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Categories | Coffee Shop',
  robots: getPrivateRobotsDirective(),
};

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
