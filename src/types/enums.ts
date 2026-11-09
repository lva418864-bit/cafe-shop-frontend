/**
 * Mirrors the backend's regex-enforced enums (user_service & operation_service).
 */
export const ROLES = ['customer', 'staff', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const ORDER_STATUSES = ['pending', 'paid', 'cancelled', 'completed'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ['khqr', 'cash', 'card', 'e_wallet'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_CURRENCIES = ['USD', 'KHR'] as const;
export type PaymentCurrency = (typeof PAYMENT_CURRENCIES)[number];

export const PAYMENT_STATUSES = [
  'pending',
  'paid',
  'success',
  'failed',
  'expired',
  'cancelled',
  'refund_required',
  'refunded',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
