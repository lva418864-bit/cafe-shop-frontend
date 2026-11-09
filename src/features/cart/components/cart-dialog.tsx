'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Coffee, LogIn, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { SelectField } from '@/components/ui/select';
import { ROUTES } from '@/constants/routes';
import { useCheckout } from '@/features/order/hooks';
import { getAccessToken } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { resolveProductImageUrl } from '@/utils/resolveImageUrl';
import { buildLoginUrl } from '@/utils/safeNextPath';
import { parseDecimal } from '@/lib/decimal';
import type { PaymentMethod } from '@/types/enums';

export interface CartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const METHOD_OPTIONS = [{ label: 'Bakong KHQR', value: 'khqr' }];

export function CartDialog({ open, onOpenChange }: CartDialogProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);

  const [method, setMethod] = useState<PaymentMethod>('khqr');
  const checkout = useCheckout();

  const isAuthenticated = Boolean(user) || getAccessToken() !== null;
  const total = items.reduce((sum, item) => sum + parseDecimal(item.unitPrice) * item.quantity, 0);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      onOpenChange(false);
      router.push(buildLoginUrl(ROUTES.CHECKOUT));
      return;
    }

    checkout.mutate(
      {
        items: items.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
          customizations: i.customizations.map((c) => ({
            group_id: c.groupId,
            option_id: c.optionId,
          })),
        })),
        method,
      },
      {
        onSuccess: () => {
          clear();
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Your cart</DialogTitle>
        </DialogHeader>

        {items.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Your cart is empty"
            description="Add something from the menu."
          />
        ) : (
          <div className="max-h-80 space-y-4 overflow-y-auto py-2">
            {items.map((item) => {
              const resolvedUrl = resolveProductImageUrl(item.imageUrl);
              return (
                <div
                  key={item.cartItemId}
                  className="border-border flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-muted flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border">
                      {resolvedUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={resolvedUrl}
                          alt={item.imageAlt || item.productName}
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
                      <p className="text-foreground truncate text-sm font-medium">
                        {item.productName}
                      </p>
                      <p className="text-foreground/50 font-mono text-xs">
                        {formatCurrency(item.unitPrice)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setQuantity(item.cartItemId, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center font-mono text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setQuantity(item.cartItemId, item.quantity + 1)}
                        disabled={item.quantity >= item.maxStock}
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="w-16 text-right font-mono text-sm">
                      {formatCurrency(parseDecimal(item.unitPrice) * item.quantity)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-brick-600 h-7 w-7"
                      onClick={() => removeItem(item.cartItemId)}
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {item.customizations?.length > 0 && (
                    <div className="text-muted-foreground ml-14 text-xs">
                      {item.customizations.map((c) => (
                        <div key={c.optionId}>
                          • {c.groupName}: {c.optionName}{' '}
                          {parseDecimal(c.extraPrice) > 0
                            ? `(+${formatCurrency(c.extraPrice)})`
                            : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {items.length > 0 && (
          <>
            <div className="border-border flex items-center justify-between border-t pt-3">
              <span className="text-foreground text-sm font-medium">Total</span>
              <span className="text-foreground font-mono text-lg">{formatCurrency(total)}</span>
            </div>
            <div className="w-48">
              <SelectField
                label="Pay with"
                options={METHOD_OPTIONS}
                value={method}
                onValueChange={(value) => setMethod(value as PaymentMethod)}
              />
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Continue browsing
          </Button>
          {items.length > 0 && (
            <Button onClick={handleCheckout} isLoading={checkout.isPending}>
              {!isAuthenticated ? (
                <>
                  <LogIn className="h-4 w-4" />
                  Checkout ({formatCurrency(total)}) — Log in to order
                </>
              ) : (
                <>Checkout &amp; Pay {formatCurrency(total)}</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
