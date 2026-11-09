'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import * as orderApi from '@/features/order/api';
import type { ListOrdersParams } from '@/features/order/api';
import type {
  CreateOrderRequest,
  OrderItemRequest,
  UpdateOrderStatusRequest,
} from '@/features/order/types';
import * as paymentApi from '@/features/payment/api';
import { queryKeys } from '@/constants/queryKeys';
import { ROUTES } from '@/constants/routes';
import { useToast } from '@/hooks/useToast';
import type { ApiError } from '@/services/apiError';
import { useAuthStore } from '@/store/authStore';
import type { PaymentMethod } from '@/types/enums';
import { buildLoginUrl } from '@/utils/safeNextPath';

/**
 * The cart's "Checkout" button uses this instead of useCreateOrder +
 * usePayForOrder separately - it chains POST /order then POST
 * /order/{id}/payment into one customer-facing action, since the backend
 * has no single "create and pay" endpoint. If payment fails after the
 * order was already created, the order itself is NOT lost - we still
 * redirect to it so the customer can retry payment from there (same as any
 * other pending order).
 */
export function useCheckout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ items, method }: { items: OrderItemRequest[]; method: PaymentMethod }) => {
      const order = await orderApi.createOrder({ items });
      try {
        await paymentApi.payForOrder(order.id, { method });
        return { order, paymentFailed: false };
      } catch {
        return { order, paymentFailed: true };
      }
    },
    onSuccess: ({ order, paymentFailed }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      if (paymentFailed) {
        toast({
          title: 'Order placed, but payment failed',
          description: 'You can retry payment from the order page.',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Order placed and paid!', variant: 'success' });
      }
      router.push(ROUTES.orderDetail(order.id));
    },
    onError: (error: ApiError) => {
      if (error.status === 401) {
        clearAuth();
        toast({
          title: 'Session expired',
          description:
            'Your session expired during checkout. Please log in again — your cart has been saved.',
          variant: 'destructive',
        });
        router.push(buildLoginUrl(ROUTES.CHECKOUT));
        return;
      }
      toast({ title: 'Could not place order', description: error.message, variant: 'destructive' });
    },
  });
}

export function useOrders(params: ListOrdersParams) {
  return useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: () => orderApi.listOrders(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => orderApi.getOrder(id),
    enabled: Number.isFinite(id),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: CreateOrderRequest) => orderApi.createOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      // Creating an order decrements stock server-side.
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      toast({ title: 'Order placed', variant: 'success' });
    },
    onError: (error: ApiError) => {
      toast({ title: 'Could not place order', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateOrderStatus(id: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: UpdateOrderStatusRequest) => orderApi.updateOrderStatus(id, payload),
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.orders.detail(id), order);
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      // Cancelling restocks server-side.
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      toast({ title: `Order marked ${order.status}`, variant: 'success' });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Could not update order status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => orderApi.cancelOrder(id),
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.orders.detail(order.id), order);
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      toast({ title: 'Order cancelled', variant: 'success' });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Could not cancel order',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
