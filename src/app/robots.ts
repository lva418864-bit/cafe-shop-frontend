import type { MetadataRoute } from 'next';
import { getSiteUrl, isProductionDeploy } from '@/lib/site';

/**
 * Generates the robots.txt file.
 * - On non-production deploys (deploy previews, branch deploys): disallows all indexing.
 * - On production deploys: allows public catalog paths, disallows admin/private routes and API endpoints.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  if (!isProductionDeploy()) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/products', '/products/*'],
      disallow: [
        '/api',
        '/api/*',
        '/login',
        '/register',
        '/checkout',
        '/checkout/*',
        '/orders',
        '/orders/*',
        '/dashboard',
        '/dashboard/*',
        '/categories',
        '/categories/*',
        '/users',
        '/users/*',
        '/products/new',
        '/products/*/edit',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
