import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  buildProductOgDescription,
  resolveProductOgImage,
} from '@/features/product/metadata';
import type { ProductResponse } from '@/features/product/types';
import { ProductDetailClient } from './product-detail-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function fetchProductServer(
  id: string,
): Promise<{ status: number; product: ProductResponse | null }> {
  const internalApi = (process.env.INTERNAL_API_BASE_URL || 'http://kong:8000').replace(
    /\/$/,
    '',
  );
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = (
    process.env.PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
  const productUrl = `${baseUrl}/products/${encodeURIComponent(id)}`;

  const { product } = await fetchProductServer(id);
  if (!product) {
    return {
      title: 'Product Not Found | Coffee Shop',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${product.name} | Coffee Shop`;
  const description = buildProductOgDescription(product);
  const ogImage = resolveProductOgImage(product, baseUrl, id);

  return {
    title,
    description,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title,
      description,
      url: productUrl,
      siteName: 'Coffee Shop',
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: ogImage.url,
          width: ogImage.width,
          height: ogImage.height,
          alt: ogImage.alt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage.url],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const baseUrl = (
    process.env.PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
  const canonicalUrl = `${baseUrl}/products/${encodeURIComponent(id)}`;

  const { status, product } = await fetchProductServer(id);
  if (status === 404) {
    notFound();
  }

  return (
    <ProductDetailClient
      productId={Number(id)}
      canonicalUrl={canonicalUrl}
      initialProduct={product ?? undefined}
    />
  );
}
