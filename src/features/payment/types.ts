import type { PaymentCurrency, PaymentMethod, PaymentStatus } from '@/types/enums';

// Mirrors operation_service's schemas/payment_schema.py.
export interface CreatePaymentRequest {
  method: PaymentMethod;
  currency?: PaymentCurrency;
  idempotency_key?: string;
}

export interface RefundPaymentRequest {
  amount: string | number;
  reason: string;
  external_refund_ref: string;
}

export interface PaymentResponse {
  id: number;
  order_id: number;
  amount: string; // Decimal-as-string
  currency: PaymentCurrency;
  method: PaymentMethod;
  status: PaymentStatus;
  transaction_ref: string;
  failure_reason: string | null;
  qr_string?: string | null;
  qr_md5?: string | null;
  deeplink_url?: string | null;
  expires_at?: string | null;
  paid_at?: string | null;
  bakong_transaction_hash?: string | null;
  payer_account_masked?: string | null;
  attempt_count?: number;
}
