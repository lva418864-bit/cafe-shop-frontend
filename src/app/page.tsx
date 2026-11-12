import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { absoluteUrl, getRobotsDirective, getSiteUrl } from '@/lib/site';
import { safeJsonLdStringify } from '@/lib/jsonLd';
import { HomeClient } from '@/app/home-client';

const siteUrl = getSiteUrl();
const canonicalUrl = absoluteUrl('/');
const ogImageUrl = absoluteUrl('/images/product-og.png');

export const metadata: Metadata = {
  title: siteConfig.defaultTitle,
  description: siteConfig.description,
  alternates: {
    canonical: canonicalUrl,
  },
  robots: getRobotsDirective(),
  openGraph: {
    title: siteConfig.defaultTitle,
    description: siteConfig.description,
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
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.defaultTitle,
    description: siteConfig.description,
    images: [ogImageUrl],
  },
};

export default function Home() {
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteUrl,
    description: siteConfig.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/products?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteUrl,
    logo: ogImageUrl,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(organizationJsonLd) }}
      />
      <h1 className="sr-only">Coffee Shop Specialty Coffee &amp; Bakery</h1>
      <noscript>
        <div className="p-8 text-center">
          <p className="text-lg">Welcome to Coffee Shop. Please proceed to the menu:</p>
          <Link href="/products" className="text-roast-600 underline">
            Browse our full coffee and bakery catalog
          </Link>
        </div>
      </noscript>
      <HomeClient />
    </>
  );
}
