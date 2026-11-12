import type { Metadata } from 'next';
import { getPrivateRobotsDirective } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Dashboard | Coffee Shop',
  robots: getPrivateRobotsDirective(),
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
