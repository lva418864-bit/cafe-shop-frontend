'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Coffee, MoreVertical, Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ProductResponse } from '@/features/product/types';
import { ROUTES } from '@/constants/routes';
import { useToast } from '@/hooks/useToast';
import { useCartStore } from '@/store/cartStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { resolveProductImageUrl } from '@/utils/resolveImageUrl';

export interface ProductCardProps {
  product: ProductResponse;
  canManage: boolean;
  onAdjustStock: (product: ProductResponse) => void;
  onDeactivate: (product: ProductResponse) => void;
  priority?: boolean;
}

/**
 * The image slot is a placeholder for now - the backend's ProductResponse
 * has no image field yet (verified Step 1). Once image hosting is added
 * server-side, swap the placeholder block below for a real <img
 * src={product.image_url} /> - everything else on the card is unaffected.
 *
 * "Add to Cart" only shows for customers (!canManage) - staff/admin get the
 * management menu instead, not a cart action.
 */
export function ProductCard({
  product,
  canManage,
  onAdjustStock,
  onDeactivate,
  priority = false,
}: ProductCardProps) {
  const isLowStock = product.stock_quantity <= 5 && product.is_active;
  const isOutOfStock = product.stock_quantity <= 0;

  const addItem = useCartStore((s) => s.addItem);
  const { toast } = useToast();
  const router = useRouter();

  const handleAddToCart = () => {
    if (product.customization_groups?.length > 0) {
      router.push(ROUTES.productDetail(product.id));
      return;
    }

    addItem({
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      maxStock: product.stock_quantity,
      imageUrl: product.image_url ?? null,
      imageAlt: product.image_alt ?? product.name,
      customizations: [],
    });
    toast({ title: 'Added to cart', description: product.name, variant: 'success' });
  };

  const resolvedImageUrl = resolveProductImageUrl(product.image_url);

  return (
    <Card className="flex flex-col overflow-hidden">
      <Link href={ROUTES.productDetail(product.id)} className="block">
        <div className="from-roast-100 to-roast-50 dark:from-roast-900/40 dark:to-roast-900/10 relative flex aspect-square w-full items-center justify-center overflow-hidden bg-gradient-to-br">
          {resolvedImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolvedImageUrl}
              alt={product.image_alt || product.name}
              width={360}
              height={360}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={priority ? 'high' : 'auto'}
              className="h-full w-full object-cover"
            />
          ) : (
            <Coffee className="text-roast-300 dark:text-roast-700 h-12 w-12" aria-hidden="true" />
          )}
        </div>
      </Link>

      <CardContent className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={ROUTES.productDetail(product.id)} className="min-w-0 flex-1">
            <h3 className="text-foreground truncate font-medium hover:underline">{product.name}</h3>
          </Link>
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  aria-label="Product actions"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.productEdit(product.id)}>Edit</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAdjustStock(product)}>
                  Adjust Stock
                </DropdownMenuItem>
                {product.is_active && (
                  <DropdownMenuItem destructive onClick={() => onDeactivate(product)}>
                    Deactivate
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {product.category && <p className="text-foreground/60 text-xs">{product.category.name}</p>}

        <p className="text-foreground font-mono text-lg">{formatCurrency(product.price)}</p>

        <div className="flex flex-wrap items-center gap-1.5">
          {canManage ? (
            <>
              <Badge variant={product.is_active ? 'success' : 'neutral'}>
                {product.is_active ? 'Active' : 'Inactive'}
              </Badge>
              {isLowStock && !isOutOfStock && <Badge variant="warning">Low stock</Badge>}
              {isOutOfStock && <Badge variant="destructive">Out of stock</Badge>}
              <span className="text-foreground/50 ml-auto font-mono text-xs">
                Stock: {product.stock_quantity}
              </span>
            </>
          ) : (
            <>
              {isOutOfStock ? (
                <Badge variant="destructive">Out of Stock</Badge>
              ) : product.is_active ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Badge variant="neutral">Unavailable</Badge>
              )}
            </>
          )}
        </div>

        {!canManage && (
          <Button
            size="sm"
            className="mt-auto w-full"
            disabled={!product.is_active || isOutOfStock}
            onClick={handleAddToCart}
          >
            <Plus className="h-4 w-4" />
            Add to Cart
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
