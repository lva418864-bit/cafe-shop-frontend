'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ArrowUpDown, Plus, ShoppingCart } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SelectField } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { OrderStatusBadge } from '@/features/order/components/order-status-badge';
import { useCancelOrder, useOrders } from '@/features/order/hooks';
import type { OrderResponse } from '@/features/order/types';
import { PayDialog } from '@/features/payment/components/pay-dialog';
import { ROUTES } from '@/constants/routes';
import { hasAnyRole } from '@/constants/roles';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateTime } from '@/utils/formatDate';
import { parseDecimal } from '@/lib/decimal';
import { useAuthStore } from '@/store/authStore';
import type { OrderStatus } from '@/types/enums';

const PAGE_SIZE = 10;
type SortKey = 'created_at' | 'total_amount';
type SortDirection = 'asc' | 'desc';

const STATUS_OPTIONS = [
  { label: 'All statuses', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Paid', value: 'paid' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection } | null>(null);
  const [payTarget, setPayTarget] = useState<OrderResponse | null>(null);
  const [cancelTarget, setCancelTarget] = useState<OrderResponse | null>(null);

  const user = useAuthStore((s) => s.user);
  const isStaff = hasAnyRole(user?.role, ['admin', 'staff']);

  const { data, isPending, isError, refetch } = useOrders({
    page,
    page_size: PAGE_SIZE,
    status: statusFilter === 'all' ? undefined : (statusFilter as OrderStatus),
  });
  const cancelOrder = useCancelOrder();

  const visibleItems = useMemo(() => {
    let items = data?.items ?? [];
    if (sort) {
      items = [...items].sort((a, b) => {
        const valueA = sort.key === 'total_amount' ? parseDecimal(a.total_amount) : a.created_at;
        const valueB = sort.key === 'total_amount' ? parseDecimal(b.total_amount) : b.created_at;
        if (valueA === valueB) return 0;
        const direction = sort.direction === 'asc' ? 1 : -1;
        return valueA > valueB ? direction : -direction;
      });
    }
    return items;
  }, [data?.items, sort]);

  const toggleSort = (key: SortKey) => {
    setSort((current) => {
      if (!current || current.key !== key) return { key, direction: 'desc' };
      if (current.direction === 'desc') return { key, direction: 'asc' };
      return null;
    });
  };

  const sortIcon = (key: SortKey) => {
    if (sort?.key !== key) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
    return sort.direction === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    );
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        breadcrumb={[{ label: 'Orders' }]}
        actions={
          <Button asChild>
            <Link href={ROUTES.ORDER_NEW}>
              <Plus className="h-4 w-4" />
              New Order
            </Link>
          </Button>
        }
      />

      <div className="mb-4 max-w-xs">
        <SelectField
          options={STATUS_OPTIONS}
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
        />
      </div>

      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState description="Could not load orders." onRetry={() => refetch()} />
      ) : visibleItems.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="No orders found"
          description="Orders you place will show up here."
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                {isStaff && <TableHead>Customer</TableHead>}
                <TableHead>
                  <button
                    onClick={() => toggleSort('created_at')}
                    className="hover:text-foreground flex items-center gap-1"
                  >
                    Date {sortIcon('created_at')}
                  </button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <button
                    onClick={() => toggleSort('total_amount')}
                    className="hover:text-foreground flex items-center gap-1"
                  >
                    Total {sortIcon('total_amount')}
                  </button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleItems.map((order) => {
                const isOwner = order.user_id === user?.id;
                const canPay = order.status === 'pending' && (isOwner || isStaff);
                const canCancel = order.status === 'pending' && isOwner;

                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono">
                      <Link href={ROUTES.orderDetail(order.id)} className="hover:underline">
                        #{order.id}
                      </Link>
                    </TableCell>
                    {isStaff && <TableCell className="font-mono">{order.user_id}</TableCell>}
                    <TableCell className="text-sm">{formatDateTime(order.created_at)}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatCurrency(order.total_amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={ROUTES.orderDetail(order.id)}>View</Link>
                      </Button>
                      {canPay && (
                        <Button variant="ghost" size="sm" onClick={() => setPayTarget(order)}>
                          Pay
                        </Button>
                      )}
                      {canCancel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-brick-600"
                          onClick={() => setCancelTarget(order)}
                        >
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {data && <Pagination {...data.meta} onPageChange={setPage} className="mt-4" />}
        </>
      )}

      {payTarget && (
        <PayDialog
          orderId={payTarget.id}
          totalAmount={payTarget.total_amount}
          open={payTarget !== null}
          onOpenChange={(open) => !open && setPayTarget(null)}
        />
      )}

      <ConfirmDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="Cancel this order?"
        description={
          cancelTarget
            ? `Order #${cancelTarget.id} will be cancelled and stock restored.`
            : undefined
        }
        confirmLabel="Cancel order"
        variant="destructive"
        isLoading={cancelOrder.isPending}
        onConfirm={() => {
          if (!cancelTarget) return;
          cancelOrder.mutate(cancelTarget.id, { onSuccess: () => setCancelTarget(null) });
        }}
      />
    </div>
  );
}
