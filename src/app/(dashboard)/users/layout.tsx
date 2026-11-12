import type { Metadata } from 'next';
import { getPrivateRobotsDirective } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Users | Coffee Shop',
  robots: getPrivateRobotsDirective(),
};

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
