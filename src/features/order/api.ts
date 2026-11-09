import { operationClient } from '@/services/axios';
import { unwrap } from '@/lib/apiResponse';
import type { ApiResponse, PaginatedData } from '@/types/api';
import type {
  CreateOrderRequest,
  OrderResponse,
  UpdateOrderStatusRequest,
} from '@/features/order/types';
import type { OrderStatus } from '@/types/enums';

export interface ListOrdersParams {
  page?: number;
  page_size?: number;
  status?: OrderStatus;
}

export async function listOrders(params: ListOrdersParams): Promise<PaginatedData<OrderResponse>> {
  const response = await operationClient.get<ApiResponse<PaginatedData<OrderResponse>>>(
    '/api/orders',
    {
      params,
    },
  );
  return unwrap(response.data);
}

export async function getOrder(id: number): Promise<OrderResponse> {
  const response = await operationClient.get<ApiResponse<OrderResponse>>(`/api/orders/${id}`);
  return unwrap(response.data);
}

export async function createOrder(payload: CreateOrderRequest): Promise<OrderResponse> {
  const response = await operationClient.post<ApiResponse<OrderResponse>>('/api/orders', payload);
  return unwrap(response.data);
}

export async function updateOrderStatus(
  id: number,
  payload: UpdateOrderStatusRequest,
): Promise<OrderResponse> {
  const response = await operationClient.patch<ApiResponse<OrderResponse>>(
    `/api/orders/${id}/status`,
    payload,
  );
  return unwrap(response.data);
}

export async function cancelOrder(id: number): Promise<OrderResponse> {
  const response = await operationClient.post<ApiResponse<OrderResponse>>(
    `/api/orders/${id}/cancel`,
  );
  return unwrap(response.data);
}
