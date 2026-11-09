'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Coffee } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { ShareLink } from '@/components/common/share-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { AdjustStockDialog } from '@/features/product/components/adjust-stock-dialog';
import { CustomerAddToCart } from '@/features/product/components/customer-add-to-cart';
import { useDeactivateProduct, useProduct } from '@/features/product/hooks';
import type { ProductResponse } from '@/features/product/types';
import { ROUTES } from '@/constants/routes';
import { hasAnyRole } from '@/constants/roles';
import { formatCurrency } from '@/utils/formatCurrency';
import { resolveProductImageUrl } from '@/utils/resolveImageUrl';
import { useAuthStore } from '@/store/authStore';

export interface ProductDetailClientProps {
  productId: number;
  canonicalUrl?: string;
  initialProduct?: ProductResponse;
}

export function ProductDetailClient({
  productId,
  canonicalUrl,
  initialProduct,
}: ProductDetailClientProps) {
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const canManage = hasAnyRole(user?.role, ['admin', 'staff']);

  const { data: product, isPending, isError, refetch } = useProduct(productId, initialProduct);
  const deactivateProduct = useDeactivateProduct();

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 sm:px-6">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
        <ErrorState
          title="Product not found"
          description="It may have been removed."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const resolvedImageUrl = resolveProductImageUrl(product.image_url);

  return (
    <div
      data-testid="product-detail-container"
      className="mx-auto w-full max-w-4xl space-y-6 px-4 sm:px-6"
    >
      <PageHeader
        title={product.name}
        breadcrumb={[{ label: 'Products', href: ROUTES.PRODUCTS }, { label: product.name }]}
        actions={
          canManage && (
            <>
              <Button variant="outline" asChild>
                <Link href={ROUTES.productEdit(product.id)}>Edit</Link>
              </Button>
              <Button variant="outline" onClick={() => setStockDialogOpen(true)}>
                Adjust Stock
              </Button>
              {product.is_active && (
                <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
                  Deactivate
                </Button>
              )}
            </>
          )
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 lg:gap-8">
        {/* Left Column: Product Image with stable aspect ratio */}
        <Card className="overflow-hidden">
          <div className="from-roast-100 to-roast-50 dark:from-roast-900/40 dark:to-roast-900/10 relative flex aspect-square w-full items-center justify-center overflow-hidden bg-gradient-to-br">
            {resolvedImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolvedImageUrl}
                alt={product.image_alt || product.name}
                width={640}
                height={640}
                className="h-full w-full object-cover"
              />
            ) : (
              <Coffee className="text-roast-300 dark:text-roast-700 h-20 w-20" aria-hidden="true" />
            )}
          </div>
        </Card>

        {/* Right Column: Product Summary, Share Button, Customizations & Order Controls */}
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant={product.is_active ? 'success' : 'neutral'}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {product.stock_quantity <= 5 && product.is_active && (
                    <Badge variant="warning">Low stock</Badge>
                  )}
                </div>

                <ShareLink
                  productId={product.id}
                  productUrl={canonicalUrl}
                  productTitle={product.name}
                  productDescription={product.description || undefined}
                />
              </div>

              <div className="border-border flex items-baseline justify-between gap-4 border-b pb-4">
                <div>
                  <h2 className="text-foreground text-xl font-semibold">{product.name}</h2>
                  <p className="text-foreground/60 text-xs">
                    {product.category?.name || 'Uncategorized'}
                  </p>
                </div>
                <p className="text-foreground font-mono text-2xl font-semibold">
                  {formatCurrency(product.price)}
                </p>
              </div>

              {product.description && (
                <p className="text-foreground/75 text-left text-sm leading-relaxed">
                  {product.description}
                </p>
              )}

              <dl className="grid grid-cols-3 gap-4 pt-1 text-sm">
                <div>
                  <dt className="text-foreground/50 text-xs">Category</dt>
                  <dd className="text-foreground font-medium">
                    {product.category?.name || 'Uncategorized'}
                  </dd>
                </div>
                <div>
                  <dt className="text-foreground/50 text-xs">Price</dt>
                  <dd className="text-foreground font-mono">{formatCurrency(product.price)}</dd>
                </div>
                <div>
                  <dt className="text-foreground/50 text-xs">Stock</dt>
                  <dd className="text-foreground font-mono">{product.stock_quantity}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {!canManage && <CustomerAddToCart product={product} />}
        </div>
      </div>

      <AdjustStockDialog
        productId={product.id}
        productName={product.name}
        currentStock={product.stock_quantity}
        open={stockDialogOpen}
        onOpenChange={setStockDialogOpen}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Deactivate product?"
        description={`"${product.name}" will no longer be orderable by customers.`}
        confirmLabel="Deactivate"
        variant="destructive"
        isLoading={deactivateProduct.isPending}
        onConfirm={() =>
          deactivateProduct.mutate(product.id, { onSuccess: () => setConfirmOpen(false) })
        }
      />
    </div>
  );
}
