import type { Role } from '@/types/enums';

export const ROLE = {
  CUSTOMER: 'customer',
  STAFF: 'staff',
  ADMIN: 'admin',
} as const satisfies Record<string, Role>;

export function hasAnyRole(userRole: Role | undefined, allowed: Role[]): boolean {
  if (!userRole) return false;
  return allowed.includes(userRole);
}
