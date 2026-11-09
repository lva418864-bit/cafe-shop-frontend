import { operationClient } from '@/services/axios';
import { unwrap } from '@/lib/apiResponse';
import type { ApiResponse } from '@/types/api';
import type {
  CreatePaymentRequest,
  PaymentResponse,
  RefundPaymentRequest,
} from '@/features/payment/types';

export async function getPayment(orderId: number): Promise<PaymentResponse> {
  const response = await operationClient.get<ApiResponse<PaymentResponse>>(
    `/api/orders/${orderId}/payment`,
  );
  return unwrap(response.data);
}

export async function payForOrder(
  orderId: number,
  payload: CreatePaymentRequest,
): Promise<PaymentResponse> {
  const response = await operationClient.post<ApiResponse<PaymentResponse>>(
    `/api/orders/${orderId}/payment`,
    payload,
  );
  return unwrap(response.data);
}

export async function verifyPayment(orderId: number): Promise<PaymentResponse> {
  const response = await operationClient.post<ApiResponse<PaymentResponse>>(
    `/api/orders/${orderId}/payment/verify`,
  );
  return unwrap(response.data);
}

export async function regenerateKhqr(
  orderId: number,
  payload?: CreatePaymentRequest,
): Promise<PaymentResponse> {
  const response = await operationClient.post<ApiResponse<PaymentResponse>>(
    `/api/orders/${orderId}/payment/regenerate`,
    payload ?? { method: 'khqr', currency: 'USD' },
  );
  return unwrap(response.data);
}

export async function cancelPayment(orderId: number): Promise<PaymentResponse> {
  const response = await operationClient.post<ApiResponse<PaymentResponse>>(
    `/api/orders/${orderId}/payment/cancel`,
  );
  return unwrap(response.data);
}

export async function refundPayment(
  orderId: number,
  payload: RefundPaymentRequest,
): Promise<PaymentResponse> {
  const response = await operationClient.post<ApiResponse<PaymentResponse>>(
    `/api/orders/${orderId}/payment/refund`,
    payload,
  );
  return unwrap(response.data);
}
