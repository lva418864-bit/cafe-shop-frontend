'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, ExternalLink, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useForm } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TruncatedValue } from '@/components/common/truncated-value';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SelectField } from '@/components/ui/select';
import {
  parseUtcMs,
  usePayForOrder,
  usePayment,
  useRegenerateKhqr,
  useVerifyPayment,
} from '@/features/payment/hooks';
import { createPaymentSchema, type CreatePaymentFormValues } from '@/features/payment/validation';
import { formatCurrency } from '@/utils/formatCurrency';

export interface PayDialogProps {
  orderId: number;
  totalAmount: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const METHOD_OPTIONS = [{ label: 'Bakong KHQR (NBC)', value: 'khqr' }];

const CURRENCY_OPTIONS = [
  { label: 'USD ($)', value: 'USD' },
  { label: 'KHR (៛)', value: 'KHR' },
];

export function PayDialog({ orderId, totalAmount, open, onOpenChange }: PayDialogProps) {
  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreatePaymentFormValues>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: { method: 'khqr', currency: 'USD' },
  });

  const { data: payment } = usePayment(orderId, { pollWhilePending: open });
  const payForOrder = usePayForOrder(orderId);
  const verifyPayment = useVerifyPayment(orderId);
  const regenerateKhqr = useRegenerateKhqr(orderId);

  const method = watch('method');
  const currency = watch('currency');

  const computeRemainingSeconds = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return 0;
    return Math.max(0, Math.ceil((parseUtcMs(expiresAt) - Date.now()) / 1000));
  };

  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    computeRemainingSeconds(payment?.expires_at),
  );

  useEffect(() => {
    if (!open || !payment?.expires_at || payment.status !== 'pending') {
      setSecondsLeft(0);
      return;
    }
    const updateRemaining = () => {
      setSecondsLeft(computeRemainingSeconds(payment.expires_at));
    };
    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [open, payment?.expires_at, payment?.status]);

  useEffect(() => {
    if (payment?.status === 'paid' || payment?.status === 'success') {
      const closeTimer = window.setTimeout(() => onOpenChange(false), 1500);
      return () => window.clearTimeout(closeTimer);
    }
  }, [payment?.status, onOpenChange]);

  const onSubmit = (values: CreatePaymentFormValues) => {
    payForOrder.mutate(values);
  };

  const hasActiveKhqr =
    payment &&
    payment.method === 'khqr' &&
    Boolean(payment.qr_string) &&
    (payment.status === 'pending' || payment.status === 'expired' || payment.status === 'failed');

  const isExpired = payment?.status === 'expired' || (hasActiveKhqr && payment?.status === 'pending' && secondsLeft <= 0);
  const isPaid = payment?.status === 'paid' || payment?.status === 'success';
  const isFailed = payment?.status === 'failed';

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pay with Bakong KHQR</DialogTitle>
          <DialogDescription>
            Order #{orderId} • Total due:{' '}
            <span className="font-mono font-medium">
              {payment
                ? formatCurrency(payment.amount, payment.currency)
                : formatCurrency(totalAmount)}
            </span>
          </DialogDescription>
        </DialogHeader>

        {isPaid ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-6 text-center">
            <CheckCircle2 className="text-sage-600 h-12 w-12" />
            <p className="text-foreground font-medium text-lg">Payment Verified!</p>
            <div className="text-foreground/60 flex max-w-full min-w-0 flex-wrap items-center justify-center gap-1.5 text-xs">
              <span className="shrink-0">Ref:</span>
              <TruncatedValue
                value={payment?.bakong_transaction_hash ?? payment?.transaction_ref}
                label="reference"
              />
            </div>
          </div>
        ) : isFailed ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-6 text-center">
            <AlertCircle className="text-brick-600 h-12 w-12" />
            <p className="text-foreground font-medium text-lg">Payment Failed</p>
            <p className="text-brick-600 text-sm">{payment?.failure_reason || 'Transaction could not be completed.'}</p>
            <Button
              type="button"
              className="mt-2"
              isLoading={regenerateKhqr.isPending}
              onClick={() => regenerateKhqr.mutate({ method: 'khqr', currency: payment?.currency || 'USD' })}
            >
              <RefreshCw className="h-4 w-4" />
              Try Again with New KHQR
            </Button>
          </div>
        ) : hasActiveKhqr && payment ? (
          <div className="space-y-4">
            <div className="border-border overflow-hidden rounded-lg border shadow-sm">
              <div className="bg-[#E1232E] px-4 py-2 text-center font-bold tracking-wider text-white">
                KHQR • BAKONG
              </div>
              <div className="bg-surface flex flex-col items-center space-y-3 p-4">
                <div className="text-center">
                  <p className="font-semibold text-foreground text-sm">Coffee Shop</p>
                  <p className="text-foreground font-mono text-base font-bold">
                    {formatCurrency(payment.amount, payment.currency)}
                  </p>
                </div>

                <Badge variant={isExpired ? 'destructive' : 'warning'}>
                  {isExpired ? 'QR Expired' : `Expires in ${formatCountdown(secondsLeft)}`}
                </Badge>

                {/* Rendered standard 2D EMVCo KHQR code */}
                <div className="bg-white p-3 rounded-md shadow-inner border border-neutral-200 flex flex-col items-center justify-center">
                  <QRCodeSVG
                    value={payment.qr_string ?? ''}
                    size={192}
                    level="M"
                    includeMargin={false}
                    aria-label="Bakong KHQR Code"
                  />
                </div>

                <p className="text-foreground/50 font-mono text-[10px] text-center">
                  MD5: ...{payment.qr_md5?.slice(-8)}
                </p>

                {payment.deeplink_url && !isExpired && (
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <a href={payment.deeplink_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Open in Bakong / Banking App
                    </a>
                  </Button>
                )}
              </div>
            </div>

            <DialogFooter className="flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {isExpired ? (
                <Button
                  type="button"
                  isLoading={regenerateKhqr.isPending}
                  onClick={() =>
                    regenerateKhqr.mutate({ method: 'khqr', currency: payment.currency })
                  }
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate KHQR
                </Button>
              ) : (
                <Button
                  type="button"
                  isLoading={verifyPayment.isPending}
                  onClick={() => verifyPayment.mutate()}
                >
                  I Have Paid — Check Status
                </Button>
              )}
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <SelectField
              label="Payment gateway"
              options={METHOD_OPTIONS}
              value={method}
              onValueChange={(value) =>
                setValue('method', value as CreatePaymentFormValues['method'])
              }
              error={errors.method?.message}
            />

            <SelectField
              label="Settlement currency"
              options={CURRENCY_OPTIONS}
              value={currency}
              onValueChange={(value) =>
                setValue('currency', value as CreatePaymentFormValues['currency'])
              }
              error={errors.currency?.message}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={payForOrder.isPending}>
                Generate KHQR ({formatCurrency(totalAmount)})
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
