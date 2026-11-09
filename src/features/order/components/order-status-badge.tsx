import { Badge, type BadgeProps } from '@/components/ui/badge';
import type { OrderStatus } from '@/types/enums';

const STATUS_VARIANT: Record<OrderStatus, NonNullable<BadgeProps['variant']>> = {
  pending: 'warning',
  paid: 'success',
  completed: 'neutral',
  cancelled: 'destructive',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
