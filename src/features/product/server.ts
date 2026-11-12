import type { ProductResponse } from '@/features/product/types';

/**
 * Returns the resolved internal Kong / API URL for server-side fetches.
 */
export function getInternalApiUrl(): string {
  const isDev = process.env.NODE_ENV !== 'production';
  return (
    process.env.KONG_INTERNAL_URL ||
    process.env.INTERNAL_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    (isDev ? 'http://localhost:8000' : 'http://kong:8000')
  ).replace(/\/+$/, '');
}

/**
 * Fetches a single product by ID on the server (for metadata, sitemap, open-graph).
 */
export async function fetchProductServer(
  id: string,
): Promise<{ status: number; product: ProductResponse | null }> {
  const internalApi = getInternalApiUrl();
  try {
    const res = await fetch(`${internalApi}/api/products/${encodeURIComponent(id)}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { status: res.status || 404, product: null };
    }
    const payload = await res.json();
    const product = (payload?.data as ProductResponse | undefined) ?? null;
    return { status: product ? 200 : 404, product };
  } catch {
    return { status: 503, product: null };
  }
}

/**
 * Fetches all active products on the server for sitemap generation.
 */
export async function fetchAllProductsServer(): Promise<ProductResponse[]> {
  const internalApi = getInternalApiUrl();
  try {
    const res = await fetch(
      `${internalApi}/api/products?page=1&page_size=100&active_only=true`,
      {
        next: { revalidate: 3600 },
        headers: { Accept: 'application/json' },
      },
    );
    if (!res.ok) {
      return [];
    }
    const payload = await res.json();
    return payload?.data?.items ?? [];
  } catch {
    return [];
  }
}
