'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Coffee, Plus } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Pagination } from '@/components/ui/pagination';
import { SelectField } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/features/category/hooks';
import { AdjustStockDialog } from '@/features/product/components/adjust-stock-dialog';
import { ProductCard } from '@/features/product/components/product-card';
import { useDeactivateProduct, useProducts } from '@/features/product/hooks';
import type { ProductResponse } from '@/features/product/types';
import { ROUTES } from '@/constants/routes';
import { hasAnyRole } from '@/constants/roles';
import { parseDecimal } from '@/lib/decimal';
import { useAuthStore } from '@/store/authStore';

const PAGE_SIZE = 12;
type SortKey = 'name' | 'price' | 'stock_quantity';

const SORT_OPTIONS = [
  { label: 'Name (A-Z)', value: 'name-asc' },
  { label: 'Name (Z-A)', value: 'name-desc' },
  { label: 'Price (low-high)', value: 'price-asc' },
  { label: 'Price (high-low)', value: 'price-desc' },
  { label: 'Stock (low-high)', value: 'stock_quantity-asc' },
  { label: 'Stock (high-low)', value: 'stock_quantity-desc' },
];

export function ProductsClient() {
  const [page, setPage] = useState(1);
  const [activeOnly, setActiveOnly] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const q = sp.get('q');
      if (q) setSearch(q);
    }
  }, []);

  const [sortValue, setSortValue] = useState('name-asc');

  const [stockTarget, setStockTarget] = useState<ProductResponse | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<ProductResponse | null>(null);

  const user = useAuthStore((s) => s.user);
  const canManage = hasAnyRole(user?.role, ['admin', 'staff']);

  const { data: categories } = useCategories();
  const { data, isPending, isError, refetch } = useProducts({
    page,
    page_size: PAGE_SIZE,
    active_only: activeOnly,
  });

  const deactivateProduct = useDeactivateProduct();

  const [sortKey, sortDir] = useMemo(() => {
    const [key, dir] = sortValue.split('-');
    return [key as SortKey, dir as 'asc' | 'desc'];
  }, [sortValue]);

  const items = data?.items;

  const filteredAndSorted = useMemo(() => {
    if (!items) return [];
    let result = [...items];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category?.name.toLowerCase().includes(q),
      );
    }

    if (selectedCategory !== 'all') {
      const catId = Number(selectedCategory);
      result = result.filter((p) => p.category_id === catId);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'price') cmp = parseDecimal(a.price) - parseDecimal(b.price);
      else if (sortKey === 'stock_quantity') cmp = a.stock_quantity - b.stock_quantity;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [items, search, selectedCategory, sortKey, sortDir]);

  const categoryOptions = useMemo(() => {
    const base = [{ label: 'All categories', value: 'all' }];
    if (!categories) return base;
    return [...base, ...categories.map((c) => ({ label: c.name, value: String(c.id) }))];
  }, [categories]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        actions={
          canManage && (
            <Button asChild>
              <Link href={ROUTES.PRODUCT_NEW}>
                <Plus className="h-4 w-4" />
                Add Product
              </Link>
            </Button>
          )
        }
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <input
            type="search"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-input bg-surface text-foreground placeholder:text-foreground/40 focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus-visible:outline-none focus-visible:ring-2 sm:max-w-xs"
          />
          <div className="w-full sm:w-48">
            <SelectField
              label=""
              options={categoryOptions}
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            />
          </div>
          <div className="w-full sm:w-48">
            <SelectField
              label=""
              options={SORT_OPTIONS}
              value={sortValue}
              onValueChange={setSortValue}
            />
          </div>
        </div>

        {canManage && (
          <label className="text-foreground/70 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="accent-primary h-4 w-4 rounded"
            />
            Active only
          </label>
        )}
      </div>

      {isPending ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Could not load products"
          description="Please check your connection and try again."
          onRetry={() => refetch()}
        />
      ) : filteredAndSorted.length === 0 ? (
        <EmptyState
          icon={Coffee}
          title="No products found"
          description={
            search || selectedCategory !== 'all'
              ? 'Try adjusting your filters or search terms.'
              : 'Add your first product to get started.'
          }
          action={
            canManage && !search && selectedCategory === 'all' ? (
              <Button asChild>
                <Link href={ROUTES.PRODUCT_NEW}>Add Product</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSorted.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                canManage={canManage}
                onAdjustStock={() => setStockTarget(product)}
                onDeactivate={() => setDeactivateTarget(product)}
              />
            ))}
          </div>

          {data && data.meta.total_pages > 1 && (
            <Pagination
              {...data.meta}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {stockTarget && (
        <AdjustStockDialog
          productId={stockTarget.id}
          productName={stockTarget.name}
          currentStock={stockTarget.stock_quantity}
          open={stockTarget !== null}
          onOpenChange={(open) => !open && setStockTarget(null)}
        />
      )}

      <ConfirmDialog
        open={deactivateTarget !== null}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
        title="Deactivate product?"
        description={
          deactivateTarget
            ? `"${deactivateTarget.name}" will no longer be orderable by customers.`
            : undefined
        }
        confirmLabel="Deactivate"
        variant="destructive"
        isLoading={deactivateProduct.isPending}
        onConfirm={() => {
          if (!deactivateTarget) return;
          deactivateProduct.mutate(deactivateTarget.id, {
            onSuccess: () => setDeactivateTarget(null),
          });
        }}
      />
    </div>
  );
}
