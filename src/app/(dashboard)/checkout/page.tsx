'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Coffee, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { SelectField } from '@/components/ui/select';
import { ROUTES } from '@/constants/routes';
import { useCheckout } from '@/features/order/hooks';
import { parseDecimal } from '@/lib/decimal';
import { useCartStore } from '@/store/cartStore';
import type { PaymentMethod } from '@/types/enums';
import { formatCurrency } from '@/utils/formatCurrency';
import { resolveProductImageUrl } from '@/utils/resolveImageUrl';

const METHOD_OPTIONS = [{ label: 'Bakong KHQR', value: 'khqr' }];

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);

  const [method, setMethod] = useState<PaymentMethod>('khqr');
  const checkout = useCheckout();

  const total = items.reduce((sum, item) => sum + parseDecimal(item.unitPrice) * item.quantity, 0);

  const handlePlaceOrder = () => {
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
        },
      },
    );
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title="Checkout"
        breadcrumb={[{ label: 'Products', href: ROUTES.PRODUCTS }, { label: 'Checkout' }]}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Browse the menu and add drinks before checking out."
          action={
            <Button asChild>
              <Link href={ROUTES.PRODUCTS}>Browse Products</Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-4">
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

            <div className="border-border flex items-center justify-between border-t pt-4">
              <span className="text-foreground text-sm font-medium">Total</span>
              <span className="text-foreground font-mono text-lg">{formatCurrency(total)}</span>
            </div>

            <div className="max-w-xs">
              <SelectField
                label="Pay with"
                options={METHOD_OPTIONS}
                value={method}
                onValueChange={(value) => setMethod(value as PaymentMethod)}
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button variant="outline" asChild>
                <Link href={ROUTES.PRODUCTS}>Continue shopping</Link>
              </Button>
              <Button onClick={handlePlaceOrder} isLoading={checkout.isPending}>
                Place Order &amp; Pay ({formatCurrency(total)})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
