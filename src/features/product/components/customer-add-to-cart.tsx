import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { getAccessToken } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/utils/formatCurrency';
import { buildLoginUrl } from '@/utils/safeNextPath';
import { parseDecimal } from '@/lib/decimal';
import type { ProductResponse } from '@/features/product/types';

export function CustomerAddToCart({ product }: { product: ProductResponse }) {
  const user = useAuthStore((s) => s.user);
  const addItem = useCartStore((s) => s.addItem);
  const cartCount = useCartStore((s) => s.items.reduce((sum, item) => sum + item.quantity, 0));
  const { toast } = useToast();
  const router = useRouter();

  const isAuthenticated = Boolean(user) || getAccessToken() !== null;

  // Maps groupId -> optionId (for single select) or array of optionIds (for multiple)
  const [selections, setSelections] = useState<Record<number, number | number[]>>({});

  const isValid = useMemo(() => {
    for (const group of product.customization_groups) {
      if (group.is_required) {
        const val = selections[group.id];
        if (group.selection_type === 'single') {
          if (val === undefined) return false;
        } else {
          if (!val || (val as number[]).length === 0) return false;
        }
      }
    }
    return true;
  }, [product.customization_groups, selections]);

  const handleSelection = (
    groupId: number,
    optionId: number,
    type: 'single' | 'multiple',
    checked?: boolean,
  ) => {
    if (type === 'single') {
      setSelections((prev) => ({ ...prev, [groupId]: optionId }));
    } else {
      setSelections((prev) => {
        const current = (prev[groupId] as number[]) || [];
        if (checked) {
          return { ...prev, [groupId]: [...current, optionId] };
        } else {
          return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
        }
      });
    }
  };

  const addCurrentSelectionToCart = () => {
    if (!isValid) return false;

    const chosenCustomizations: {
      groupId: number;
      groupName: string;
      optionId: number;
      optionName: string;
      extraPrice: string;
    }[] = [];
    for (const group of product.customization_groups) {
      const val = selections[group.id];
      if (val === undefined) continue;

      const optionIds = Array.isArray(val) ? val : [val];
      for (const optId of optionIds) {
        const option = group.options.find((o) => o.id === optId);
        if (option) {
          chosenCustomizations.push({
            groupId: group.id,
            groupName: group.name,
            optionId: option.id,
            optionName: option.name,
            extraPrice: option.extra_price,
          });
        }
      }
    }

    const extraTotal = chosenCustomizations.reduce((sum, c) => sum + parseDecimal(c.extraPrice), 0);
    const effectiveUnitPrice = (parseDecimal(product.price) + extraTotal).toFixed(2);

    addItem({
      productId: product.id,
      productName: product.name,
      unitPrice: effectiveUnitPrice,
      maxStock: product.stock_quantity,
      imageUrl: product.image_url ?? null,
      imageAlt: product.image_alt ?? product.name,
      customizations: chosenCustomizations,
    });
    return true;
  };

  const handleAddToCart = () => {
    if (!addCurrentSelectionToCart()) return;
    toast({ title: 'Added to cart', description: product.name, variant: 'success' });
  };

  const handleOrderNow = () => {
    if (isValid) {
      addCurrentSelectionToCart();
    }
    if (!isAuthenticated) {
      router.push(buildLoginUrl(ROUTES.CHECKOUT));
      return;
    }
    router.push(ROUTES.CHECKOUT);
  };

  if (!product.is_active || product.stock_quantity <= 0) {
    return (
      <div>
        <Button disabled className="w-full">
          Currently Unavailable
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {product.customization_groups.map((group) => (
        <Card key={group.id}>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{group.name}</h3>
              {group.is_required ? (
                <span className="bg-muted text-muted-foreground rounded px-2 py-1 text-xs">
                  Required
                </span>
              ) : (
                <span className="text-muted-foreground text-xs">Optional</span>
              )}
            </div>
            <div className="space-y-2">
              {group.options.map((option) => (
                <label
                  key={option.id}
                  className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-md p-2"
                >
                  {group.selection_type === 'single' ? (
                    <input
                      type="radio"
                      name={`group-${group.id}`}
                      className="accent-roast-600 h-4 w-4"
                      checked={selections[group.id] === option.id}
                      onChange={() => handleSelection(group.id, option.id, 'single')}
                    />
                  ) : (
                    <input
                      type="checkbox"
                      className="accent-roast-600 border-border h-4 w-4 rounded"
                      checked={((selections[group.id] as number[]) || []).includes(option.id)}
                      onChange={(e) =>
                        handleSelection(group.id, option.id, 'multiple', e.target.checked)
                      }
                    />
                  )}
                  <span className="flex-1 text-sm">{option.name}</span>
                  {parseDecimal(option.extra_price) > 0 && (
                    <span className="text-muted-foreground text-sm">
                      +{formatCurrency(option.extra_price)}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface/95 p-3 backdrop-blur shadow-lg sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-0">
        <div className="mx-auto flex max-w-4xl flex-col gap-2 sm:flex-row">
          <Button
            className="flex-1 w-full sm:w-auto h-11"
            size="lg"
            disabled={!isValid}
            onClick={handleAddToCart}
          >
            <ShoppingBag className="h-4 w-4" />
            Add to Cart
          </Button>
          <Button
            variant="outline"
            className="flex-1 w-full sm:w-auto h-11"
            size="lg"
            disabled={!isValid && cartCount === 0}
            onClick={handleOrderNow}
          >
            {isAuthenticated ? 'Proceed to Checkout' : 'Checkout (Log in to order)'}
          </Button>
        </div>
      </div>
    </div>
  );
}
