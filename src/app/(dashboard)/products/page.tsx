import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ProductsClient } from './products-client';
import { Skeleton } from '@/components/ui/skeleton';
import { siteConfig } from '@/config/site';
import { absoluteUrl, getRobotsDirective } from '@/lib/site';

const canonicalUrl = absoluteUrl('/products');
const ogImageUrl = absoluteUrl('/images/product-og.png');

export const metadata: Metadata = {
  title: 'Specialty Coffee Menu & Bakery',
  description:
    'Browse handcrafted espresso, cold brews, pour-over coffee, and freshly baked pastries. Order online with instant Bakong KHQR checkout.',
  alternates: {
    canonical: canonicalUrl,
  },
  robots: getRobotsDirective(),
  openGraph: {
    title: `Specialty Coffee Menu & Bakery | ${siteConfig.name}`,
    description:
      'Browse handcrafted espresso, cold brews, pour-over coffee, and freshly baked pastries. Order online with instant Bakong KHQR checkout.',
    url: canonicalUrl,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: 'website',
    images: [
      {
        url: ogImageUrl,
        secureUrl: ogImageUrl.startsWith('https://') ? ogImageUrl : undefined,
        type: 'image/png',
        width: 1200,
        height: 630,
        alt: `Specialty Coffee Menu - ${siteConfig.name}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Specialty Coffee Menu & Bakery | ${siteConfig.name}`,
    description:
      'Browse handcrafted espresso, cold brews, pour-over coffee, and freshly baked pastries. Order online with instant Bakong KHQR checkout.',
    images: [ogImageUrl],
  },
};

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
