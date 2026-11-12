'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Coffee } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { TruncatedValue } from '@/components/common/truncated-value';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ErrorState } from '@/components/ui/error-state';
import { SelectField } from '@/components/ui/select';
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
import { useCancelOrder, useOrder, useUpdateOrderStatus } from '@/features/order/hooks';
import { ORDER_STATUS_TRANSITIONS } from '@/features/order/transitions';
import { PayDialog } from '@/features/payment/components/pay-dialog';
import { usePayment } from '@/features/payment/hooks';
import { ROUTES } from '@/constants/routes';
import { hasAnyRole } from '@/constants/roles';
import { parseDecimal } from '@/lib/decimal';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateTime } from '@/utils/formatDate';
import { resolveProductImageUrl } from '@/utils/resolveImageUrl';
import { useAuthStore } from '@/store/authStore';
import type { OrderStatus } from '@/types/enums';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = Number(params.id);

  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState<string | undefined>(undefined);

  const user = useAuthStore((s) => s.user);
  const isStaff = hasAnyRole(user?.role, ['admin', 'staff']);

  const { data: order, isPending, isError, refetch } = useOrder(orderId);
  const { data: payment, isError: paymentIsError } = usePayment(orderId, {
    pollWhilePending: order?.status === 'pending',
  });
  const cancelOrder = useCancelOrder();
  const updateStatus = useUpdateOrderStatus(orderId);

  if (isPending) {
    return (
      <div className="max-w-2xl space-y-3">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !order) {
    return <ErrorState title="Order not found" onRetry={() => refetch()} />;
  }

  const isOwner = order.user_id === user?.id;
  const canPay = order.status === 'pending' && (isOwner || isStaff);
  const canCancel = order.status === 'pending' && isOwner;
  const availableTransitions = ORDER_STATUS_TRANSITIONS[order.status];
  const statusOptions = availableTransitions.map((s) => ({ label: STATUS_LABELS[s], value: s }));

  return (
    <div>
      <PageHeader
        title={`Order #${order.id}`}
        breadcrumb={[{ label: 'Orders', href: ROUTES.ORDERS }, { label: `#${order.id}` }]}
        actions={
          <>
            {canPay && <Button onClick={() => setPayDialogOpen(true)}>Pay with Bakong KHQR</Button>}
            {canCancel && (
              <Button variant="destructive" onClick={() => setCancelDialogOpen(true)}>
                Cancel Order
              </Button>
            )}
          </>
        }
      />

      <div className="grid max-w-3xl gap-6 md:grid-cols-3">
        <Card className="min-w-0 md:col-span-2">
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <OrderStatusBadge status={order.status} />
              <span className="text-foreground/50 text-sm">{formatDateTime(order.created_at)}</span>
            </div>

            {/* Mobile Order Items (stacked cards) */}
            <div className="space-y-3 sm:hidden">
              {order.items.map((item) => {
                const resolvedImg = resolveProductImageUrl(item.product_image_url);
                return (
                  <div
                    key={item.id}
                    className="border-border bg-surface rounded-lg border p-3 space-y-2 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-muted flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border">
                        {resolvedImg ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={resolvedImg}
                            alt={item.product_image_alt || item.product_name}
                            width={44}
                            height={44}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Coffee className="text-foreground/40 h-5 w-5" aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{item.product_name}</div>
                        <div className="text-foreground/60 text-xs font-mono">
                          {formatCurrency(item.unit_price)} × {item.quantity}
                        </div>
                      </div>
                      <div className="font-mono font-medium text-right">
                        {formatCurrency(item.subtotal)}
                      </div>
                    </div>

                    {item.customizations && item.customizations.length > 0 && (
                      <div className="text-muted-foreground ml-14 space-y-0.5 text-xs">
                        {item.customizations.map((c) => (
                          <div key={c.id}>
                            • {c.group_name}: {c.option_name}
                            {parseDecimal(c.extra_price) > 0
                              ? ` (+${formatCurrency(c.extra_price)})`
                              : ''}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Order Items (Table) */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Unit price</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => {
                    const resolvedImg = resolveProductImageUrl(item.product_image_url);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border">
                              {resolvedImg ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={resolvedImg}
                                  alt={item.product_image_alt || item.product_name}
                                  width={40}
                                  height={40}
                                  loading="lazy"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Coffee className="text-foreground/40 h-5 w-5" aria-hidden="true" />
                              )}
                            </div>
                            <div>
                              <div>{item.product_name}</div>
                              {item.customizations && item.customizations.length > 0 && (
                                <div className="text-muted-foreground mt-1 space-y-0.5 text-xs">
                                  {item.customizations.map((c) => (
                                    <div key={c.id}>
                                      • {c.group_name}: {c.option_name}
                                      {parseDecimal(c.extra_price) > 0
                                        ? ` (+${formatCurrency(c.extra_price)})`
                                        : ''}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell className="font-mono">{item.quantity}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(item.subtotal)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="border-border flex items-center justify-between border-t pt-4">
              <span className="text-foreground text-sm font-medium">Total</span>
              <span className="text-foreground font-mono text-lg">
                {formatCurrency(order.total_amount)}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-6">
          <Card className="min-w-0 overflow-hidden">
            <CardContent className="space-y-3 pt-6">
              <h3 className="font-display text-foreground text-base">Payment (Bakong KHQR)</h3>
              {paymentIsError || !payment ? (
                <p className="text-foreground/50 text-sm">No payment recorded yet.</p>
              ) : (
                <dl className="space-y-2.5 text-sm">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <dt className="text-foreground/50 shrink-0">Method</dt>
                    <dd className="text-foreground min-w-0 text-right uppercase break-all [overflow-wrap:anywhere]">
                      {payment.method}
                    </dd>
                  </div>
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <dt className="text-foreground/50 shrink-0">Amount</dt>
                    <dd className="text-foreground min-w-0 text-right font-mono break-all [overflow-wrap:anywhere]">
                      {formatCurrency(payment.amount, payment.currency)}
                    </dd>
                  </div>
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <dt className="text-foreground/50 shrink-0">Status</dt>
                    <dd className="text-foreground min-w-0 text-right font-medium break-all [overflow-wrap:anywhere]">
                      {payment.status}
                    </dd>
                  </div>
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <dt className="text-foreground/50 shrink-0 pt-0.5">Reference</dt>
                    <dd className="text-foreground min-w-0 flex-1 text-right">
                      <TruncatedValue value={payment.transaction_ref} label="reference" />
                    </dd>
                  </div>
                  {payment.payer_account_masked && (
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <dt className="text-foreground/50 shrink-0">Payer</dt>
                      <dd className="text-foreground min-w-0 flex-1 text-right">
                        <TruncatedValue
                          value={payment.payer_account_masked}
                          label="payer"
                          copyable={false}
                        />
                      </dd>
                    </div>
                  )}
                  {payment.failure_reason && (
                    <div className="min-w-0 space-y-1">
                      <dt className="text-foreground/50">Failure reason</dt>
                      <dd className="text-brick-600 break-words [overflow-wrap:anywhere]">
                        {payment.failure_reason}
                      </dd>
                    </div>
                  )}
                </dl>
              )}
            </CardContent>
          </Card>

          {isStaff && statusOptions.length > 0 && (
            <Card>
              <CardContent className="space-y-3 pt-6">
                <h3 className="font-display text-foreground text-base">Update status</h3>
                <SelectField
                  placeholder="Choose new status"
                  options={statusOptions}
                  value={nextStatus}
                  onValueChange={setNextStatus}
                />
                <Button
                  size="sm"
                  className="w-full"
                  disabled={!nextStatus}
                  isLoading={updateStatus.isPending}
                  onClick={() =>
                    nextStatus && updateStatus.mutate({ status: nextStatus as OrderStatus })
                  }
                >
                  Update
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <PayDialog
        orderId={order.id}
        totalAmount={order.total_amount}
        open={payDialogOpen}
        onOpenChange={setPayDialogOpen}
      />

      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel this order?"
        description={`Order #${order.id} will be cancelled and stock restored.`}
        confirmLabel="Cancel order"
        variant="destructive"
        isLoading={cancelOrder.isPending}
        onConfirm={() =>
          cancelOrder.mutate(order.id, { onSuccess: () => setCancelDialogOpen(false) })
        }
      />
    </div>
  );
}
