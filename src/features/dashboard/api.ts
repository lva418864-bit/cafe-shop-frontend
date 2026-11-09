import { reportClient } from '@/services/axios';
import { unwrap } from '@/lib/apiResponse';
import type { ApiResponse } from '@/types/api';
import type {
  DailySalesPoint,
  InventoryAlertResponse,
  SalesSummaryResponse,
  SyncResultResponse,
  TopProductResponse,
  UserSummaryResponse,
} from '@/features/dashboard/types';

export interface DateRangeParams {
  start_date?: string;
  end_date?: string;
}

export async function triggerSync(): Promise<SyncResultResponse> {
  const response = await reportClient.post<ApiResponse<SyncResultResponse>>('/api/reports/sync');
  return unwrap(response.data);
}

export async function getSalesSummary(params: DateRangeParams): Promise<SalesSummaryResponse> {
  const response = await reportClient.get<ApiResponse<SalesSummaryResponse>>(
    '/api/reports/sales-summary',
    { params },
  );
  return unwrap(response.data);
}

export async function getDailySales(params: DateRangeParams): Promise<DailySalesPoint[]> {
  const response = await reportClient.get<ApiResponse<DailySalesPoint[]>>(
    '/api/reports/daily-sales',
    {
      params,
    },
  );
  return unwrap(response.data);
}

export async function getTopProducts(
  params: DateRangeParams & { limit?: number },
): Promise<TopProductResponse[]> {
  const response = await reportClient.get<ApiResponse<TopProductResponse[]>>(
    '/api/reports/top-products',
    { params },
  );
  return unwrap(response.data);
}

export async function getLowStock(params: {
  threshold?: number;
}): Promise<InventoryAlertResponse[]> {
  const response = await reportClient.get<ApiResponse<InventoryAlertResponse[]>>(
    '/api/reports/low-stock',
    { params },
  );
  return unwrap(response.data);
}

export async function getUsersSummary(params: DateRangeParams): Promise<UserSummaryResponse> {
  const response = await reportClient.get<ApiResponse<UserSummaryResponse>>(
    '/api/reports/users-summary',
    { params },
  );
  return unwrap(response.data);
}
