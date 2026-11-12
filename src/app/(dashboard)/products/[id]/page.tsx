import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  buildProductOgDescription,
  resolveProductOgImage,
} from '@/features/product/metadata';
import { fetchProductServer } from '@/features/product/server';
import { buildCanonicalProductUrl, getRobotsDirective, getSiteUrl } from '@/lib/site';
import { safeJsonLdStringify } from '@/lib/jsonLd';
import { ProductDetailClient } from './product-detail-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = getSiteUrl();
  const productUrl = buildCanonicalProductUrl(id);

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
  const fbAppId = process.env.NEXT_PUBLIC_FB_APP_ID?.trim();
  const priceAmount = Number(product.price ?? 0).toFixed(2);

  const otherMetadata: Record<string, string> = {
    'og:type': 'product',
    'product:price:amount': priceAmount,
    'product:price:currency': 'USD',
  };

  if (fbAppId) {
    otherMetadata['fb:app_id'] = fbAppId;
  }

  return {
    title,
    description,
    alternates: {
      canonical: productUrl,
    },
    robots: getRobotsDirective(),
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
          secureUrl: ogImage.url.startsWith('https://') ? ogImage.url : undefined,
          type: 'image/png',
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
    other: otherMetadata,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const canonicalUrl = buildCanonicalProductUrl(id);

  const { status, product } = await fetchProductServer(id);
  if (status === 404 || !product) {
    notFound();
  }

  const baseUrl = getSiteUrl();
  const ogImage = resolveProductOgImage(product, baseUrl, id);

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `Order ${product.name} at Coffee Shop. Fast, seamless payments via Bakong KHQR.`,
    image: [ogImage.url],
    sku: `PROD-${product.id}`,
    category: product.category?.name || 'Coffee & Bakery',
    offers: {
      '@type': 'Offer',
      price: Number(product.price ?? 0).toFixed(2),
      priceCurrency: 'USD',
      availability:
        product.is_active && product.stock_quantity > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: canonicalUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(productJsonLd) }}
      />
      <ProductDetailClient
        productId={Number(id)}
        canonicalUrl={canonicalUrl}
        initialProduct={product ?? undefined}
      />
    </>
  );
}
