import type { OrderStatus } from '@/types/enums';

/**
 * Mirrors operation_service's OrderStatus.TRANSITIONS exactly (Step 1) -
 * used purely for UX (hiding/disabling status options that would 409).
 * The backend re-validates every transition server-side regardless; this
 * is not a security boundary, just a nicer form.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['completed', 'cancelled'],
  cancelled: [],
  completed: [],
};
