import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';
import { fetchAllProductsServer } from '@/features/product/server';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
  ];

  try {
    const products = await fetchAllProductsServer();
    const productRoutes: MetadataRoute.Sitemap = products
      .filter((p) => p.is_active)
      .map((product) => {
        const item: MetadataRoute.Sitemap[number] = {
          url: `${siteUrl}/products/${product.id}`,
          changeFrequency: 'weekly',
          priority: 0.8,
        };

        // Only include lastModified when real date exists
        const timestamp = product.images?.[0]?.created_at;
        if (timestamp) {
          const parsed = new Date(timestamp);
          if (!isNaN(parsed.getTime())) {
            item.lastModified = parsed;
          }
        }

        return item;
      });

    return [...staticRoutes, ...productRoutes];
  } catch (err) {
    console.warn('Failed to fetch products for sitemap; using static routes fallback:', err);
    return staticRoutes;
  }
}
