'use client';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { SessionBootstrap } from '@/features/auth/components/session-bootstrap';
import { useLogout } from '@/features/auth/hooks';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <DashboardShell
      role={user?.role}
      userName={user?.username}
      userRole={user?.role}
      profileHref={user ? ROUTES.userDetail(user.id) : undefined}
      ordersHref={ROUTES.ORDERS}
      onLogout={logout}
    >
      {children}
    </DashboardShell>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionBootstrap>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </SessionBootstrap>
  );
}
