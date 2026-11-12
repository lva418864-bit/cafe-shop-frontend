import type { Metadata } from 'next';
import { getPrivateRobotsDirective } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Orders | Coffee Shop',
  robots: getPrivateRobotsDirective(),
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
