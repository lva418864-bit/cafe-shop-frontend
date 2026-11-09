import { Badge } from '@/components/ui/badge';
import type { Role } from '@/types/enums';

const ROLE_VARIANT: Record<Role, 'neutral' | 'warning' | 'success'> = {
  customer: 'neutral',
  staff: 'warning',
  admin: 'success',
};

export function RoleBadge({ role }: { role: Role }) {
  return <Badge variant={ROLE_VARIANT[role]}>{role}</Badge>;
}
