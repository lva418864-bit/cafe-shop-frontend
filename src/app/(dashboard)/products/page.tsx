import { Suspense } from 'react';
import { ProductsClient } from './products-client';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 max-w-xl">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-48 w-full" />
        </div>
      }
    >
      <ProductsClient />
    </Suspense>
  );
}
