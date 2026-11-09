'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as paymentApi from '@/features/payment/api';
import type { CreatePaymentRequest } from '@/features/payment/types';
import { queryKeys } from '@/constants/queryKeys';
import { useToast } from '@/hooks/useToast';
import type { ApiError } from '@/services/apiError';

/**
 * Parses an ISO-8601 timestamp string as UTC even if the server omitted a
 * trailing 'Z' or timezone offset.
 */
export function parseUtcMs(isoString: string | null | undefined): number {
  if (!isoString) return 0;
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(isoString);
  return new Date(hasTimezone ? isoString : `${isoString}Z`).getTime();
}

/**
 * Fetches payment state for an order, with optional 3-second polling while a
 * dynamic Bakong KHQR attempt is pending and unexpired.
 */
export function usePayment(orderId: number, options?: { pollWhilePending?: boolean }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.orders.payment(orderId),
    queryFn: () => paymentApi.getPayment(orderId),
    enabled: Number.isFinite(orderId) && orderId > 0,
    retry: false,
    refetchInterval: (q) => {
      if (!options?.pollWhilePending) return false;
      const data = q.state.data;
      if (!data || data.status !== 'pending') return false;
      if (data.expires_at && parseUtcMs(data.expires_at) <= Date.now()) {
        return false;
      }
      return 3000;
    },
  });

  useEffect(() => {
    if (query.data?.status === 'paid' || query.data?.status === 'success') {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
    }
  }, [query.data?.status, orderId, queryClient]);

  return query;
}

export function usePayForOrder(orderId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: CreatePaymentRequest) => paymentApi.payForOrder(orderId, payload),
    onSuccess: (payment) => {
      queryClient.setQueryData(queryKeys.orders.payment(orderId), payment);
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      if (payment.status === 'pending' && payment.qr_string) {
        toast({
          title: 'Bakong KHQR ready',
          description: 'Scan the QR code with your Bakong or banking app.',
          variant: 'success',
        });
      } else {
        toast({ title: 'Payment successful', variant: 'success' });
      }
    },
    onError: (error: ApiError) => {
      toast({ title: 'Payment failed', description: error.message, variant: 'destructive' });
    },
  });
}

export function useVerifyPayment(orderId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => paymentApi.verifyPayment(orderId),
    onSuccess: (payment) => {
      queryClient.setQueryData(queryKeys.orders.payment(orderId), payment);
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      if (payment.status === 'paid' || payment.status === 'success') {
        toast({ title: 'Bakong payment confirmed!', variant: 'success' });
      } else if (payment.status === 'expired') {
        toast({
          title: 'KHQR has expired',
          description: 'Please regenerate a new QR code.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Awaiting payment',
          description: 'No completed transfer found yet on Bakong.',
        });
      }
    },
    onError: (error: ApiError) => {
      toast({ title: 'Verification error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useRegenerateKhqr(orderId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload?: CreatePaymentRequest) => paymentApi.regenerateKhqr(orderId, payload),
    onSuccess: (payment) => {
      queryClient.setQueryData(queryKeys.orders.payment(orderId), payment);
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      toast({ title: 'New Bakong KHQR generated', variant: 'success' });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Could not regenerate KHQR',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
