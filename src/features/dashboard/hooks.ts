'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as dashboardApi from '@/features/dashboard/api';
import type { DateRangeParams } from '@/features/dashboard/api';
import { queryKeys } from '@/constants/queryKeys';
import { useToast } from '@/hooks/useToast';
import type { ApiError } from '@/services/apiError';

export function useSalesSummary(params: DateRangeParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.reports.salesSummary(params),
    queryFn: () => dashboardApi.getSalesSummary(params),
    enabled: options?.enabled,
  });
}

export function useDailySales(params: DateRangeParams) {
  return useQuery({
    queryKey: queryKeys.reports.dailySales(params),
    queryFn: () => dashboardApi.getDailySales(params),
  });
}

export function useTopProducts(params: DateRangeParams & { limit?: number }) {
  return useQuery({
    queryKey: queryKeys.reports.topProducts(params),
    queryFn: () => dashboardApi.getTopProducts(params),
  });
}

export function useLowStock(threshold: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.reports.lowStock({ threshold }),
    queryFn: () => dashboardApi.getLowStock({ threshold }),
    enabled: options?.enabled,
  });
}

export function useUsersSummary(params: DateRangeParams) {
  return useQuery({
    queryKey: queryKeys.reports.usersSummary(params),
    queryFn: () => dashboardApi.getUsersSummary(params),
  });
}

export function useTriggerSync() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => dashboardApi.triggerSync(),
    onSuccess: (result) => {
      // Every report query depends on data this just refreshed.
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast({
        title: 'Sync complete',
        description: `${result.users_synced} users, ${result.products_synced} products, ${result.orders_synced} orders synced.`,
        variant: 'success',
      });
    },
    onError: (error: ApiError) => {
      toast({ title: 'Sync failed', description: error.message, variant: 'destructive' });
    },
  });
}
