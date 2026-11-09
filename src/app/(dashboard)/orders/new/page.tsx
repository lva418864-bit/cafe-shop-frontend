'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Coffee, Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';

import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { SelectField } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreateOrder } from '@/features/order/hooks';
import { createOrderSchema, type CreateOrderFormValues } from '@/features/order/validation';
import { useProducts } from '@/features/product/hooks';
import { ROUTES } from '@/constants/routes';
import { parseDecimal } from '@/lib/decimal';
import { formatCurrency } from '@/utils/formatCurrency';
import { resolveProductImageUrl } from '@/utils/resolveImageUrl';

export default function NewOrderPage() {
  const router = useRouter();

  // Simple approach appropriate for this scale: load up to 100 active
  // products for the picker in one page. A catalog larger than that would
  // need a real searchable/paginated picker instead.
  const {
    data: productsPage,
    isPending,
    isError,
    refetch,
  } = useProducts({ page: 1, page_size: 100, active_only: true });
  const products = useMemo(() => productsPage?.items ?? [], [productsPage]);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateOrderFormValues>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: { items: [{ product_id: 0, quantity: 1 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');
  const createOrder = useCreateOrder();

  const productOptions = useMemo(
    () =>
      products.map((p) => ({
        label: `${p.name} (${p.stock_quantity} in stock)`,
        value: String(p.id),
      })),
    [products],
  );

  // Deliberately NOT wrapped in useMemo: watch("items") already triggers a
  // re-render on every change (including nested setValue calls from the
  // Select), and memoizing on top of that caused this to go stale after a
  // dynamically-added row's product was selected - the array reference
  // watch() returns doesn't reliably change in a way useMemo picks up. This
  // recalculation is cheap (a handful of items), so plain inline math is
  // both simpler and correct.
  const total = watchedItems.reduce((sum, item) => {
    const product = products.find((p) => p.id === Number(item.product_id));
    if (!product) return sum;
    return sum + parseDecimal(product.price) * (item.quantity || 0);
  }, 0);

  if (isPending) {
    return (
      <div className="max-w-2xl space-y-3">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState description="Could not load products." onRetry={() => refetch()} />;
  }

  const onSubmit = (values: CreateOrderFormValues) => {
    createOrder.mutate(
      { items: values.items },
      { onSuccess: (order) => router.push(ROUTES.orderDetail(order.id)) },
    );
  };

  return (
    <div>
      <PageHeader
        title="New Order"
        breadcrumb={[{ label: 'Orders', href: ROUTES.ORDERS }, { label: 'New' }]}
      />

      {products.length === 0 ? (
        <ErrorState
          title="No products available"
          description="There's nothing orderable right now."
        />
      ) : (
        <Card className="max-w-2xl">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {fields.map((field, index) => {
                const selectedProductId = Number(watch(`items.${index}.product_id`));
                const selectedProduct = products.find((p) => p.id === selectedProductId);
                const resolvedImg = resolveProductImageUrl(selectedProduct?.image_url);
                return (
                  <div key={field.id} className="flex items-end gap-2">
                    <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border">
                      {resolvedImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={resolvedImg}
                          alt={selectedProduct?.image_alt || selectedProduct?.name || 'Product'}
                          width={40}
                          height={40}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Coffee className="text-foreground/40 h-5 w-5" aria-hidden="true" />
                      )}
                    </div>
                    <div className="flex-1">
                      <SelectField
                        label={index === 0 ? 'Product' : undefined}
                        placeholder="Select a product"
                        options={productOptions}
                        value={
                          watch(`items.${index}.product_id`)
                            ? String(watch(`items.${index}.product_id`))
                            : undefined
                        }
                        onValueChange={(value) =>
                          setValue(`items.${index}.product_id`, Number(value))
                        }
                        error={errors.items?.[index]?.product_id?.message}
                      />
                    </div>
                    <div className="w-28">
                      <Input
                        label={index === 0 ? 'Quantity' : undefined}
                        type="number"
                        min={1}
                        error={errors.items?.[index]?.quantity?.message}
                        {...register(`items.${index}.quantity`)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}

              {errors.items?.root?.message && (
                <p className="text-brick-600 text-xs">{errors.items.root.message}</p>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ product_id: 0, quantity: 1 })}
              >
                <Plus className="h-4 w-4" />
                Add item
              </Button>

              <div className="border-border flex items-center justify-between border-t pt-4">
                <span className="text-foreground/60 text-sm">Estimated total</span>
                <span className="text-foreground font-mono text-lg">{formatCurrency(total)}</span>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.push(ROUTES.ORDERS)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={createOrder.isPending}>
                  Place Order
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
