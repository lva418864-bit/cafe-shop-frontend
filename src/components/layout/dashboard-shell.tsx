import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { hasAnyRole } from '@/constants/roles';
import type { Role } from '@/types/enums';

export interface DashboardShellProps {
  children: React.ReactNode;
  role?: Role;
  userName?: string;
  userRole?: string;
  profileHref?: string;
  ordersHref?: string;
  onLogout?: () => void;
}

/**
 * Customers get a top Navbar with horizontal nav links (Products only -
 * Orders is intentionally not a primary nav item for them anymore, see
 * NAV_ITEMS.customerVisible - they order via the cart instead, and reach
 * order history through the account menu's "My Orders") and no Sidebar at
 * all. Staff/admin keep the Sidebar, since they have more sections
 * (Dashboard, Orders, Users, Reports) that benefit from persistent
 * left-hand navigation.
 */
export function DashboardShell({
  children,
  role,
  userName,
  userRole,
  profileHref,
  ordersHref,
  onLogout,
}: DashboardShellProps) {
  const isStaff = hasAnyRole(role, ['admin', 'staff']);

  if (!isStaff) {
    return (
      <div className="bg-background flex min-h-screen flex-col">
        <Navbar
          userName={userName}
          userRole={userRole}
          profileHref={profileHref}
          ordersHref={ordersHref}
          onLogout={onLogout}
          navRole={role}
        />
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen">
      <Sidebar role={role} />
      <div className="flex flex-1 flex-col">
        <Navbar
          userName={userName}
          userRole={userRole}
          profileHref={profileHref}
          onLogout={onLogout}
        />
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
