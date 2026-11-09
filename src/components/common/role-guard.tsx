'use client';

import { ShieldAlert } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { hasAnyRole } from '@/constants/roles';
import { useAuthStore } from '@/store/authStore';
import type { Role } from '@/types/enums';

export interface RoleGuardProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

/**
 * Client-side, fine-grained authorization for a page/section - unlike
 * middleware (which only checks "is there a session"), this checks the
 * actual role from the verified user (populated by SessionBootstrap via
 * GET /user/me). This is a UX guard, not the security boundary - the
 * backend enforces real RBAC on every request regardless of what this
 * shows or hides.
 */
export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Spinner label="Checking permissions..." />;
  }

  if (!hasAnyRole(user.role, allowedRoles)) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="You don't have access to this page"
        description={`This page requires one of these roles: ${allowedRoles.join(', ')}.`}
      />
    );
  }

  return <>{children}</>;
}
