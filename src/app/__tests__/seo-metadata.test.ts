import { describe, it, expect, vi, beforeEach } from 'vitest';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import {
  getSiteUrl,
  isProductionDeploy,
  getRobotsDirective,
  getPrivateRobotsDirective,
  buildCanonicalProductUrl,
} from '@/lib/site';
import { safeJsonLdStringify } from '@/lib/jsonLd';
import { metadata as authMetadata } from '@/app/(auth)/layout';
import { metadata as checkoutMetadata } from '@/app/(dashboard)/checkout/layout';
import { metadata as ordersMetadata } from '@/app/(dashboard)/orders/layout';
import { metadata as dashboardMetadata } from '@/app/(dashboard)/dashboard/layout';
import { metadata as categoriesMetadata } from '@/app/(dashboard)/categories/layout';
import { metadata as usersMetadata } from '@/app/(dashboard)/users/layout';

describe('SEO & Metadata Foundation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.PUBLIC_BASE_URL;
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.URL;
    delete process.env.CONTEXT;
  });

  describe('Site URL resolution', () => {
    it('prioritizes PUBLIC_BASE_URL over NEXT_PUBLIC_BASE_URL and Netlify URL', () => {
      process.env.PUBLIC_BASE_URL = 'https://custom-domain.com/';
      process.env.NEXT_PUBLIC_BASE_URL = 'https://next-public.com';
      process.env.URL = 'https://netlify-site.netlify.app';

      expect(getSiteUrl()).toBe('https://custom-domain.com');
    });

    it('falls back to Netlify URL when PUBLIC_BASE_URL is absent', () => {
      process.env.URL = 'https://netlify-site.netlify.app/';
      expect(getSiteUrl()).toBe('https://netlify-site.netlify.app');
    });

    it('strips trailing slashes from canonical product URLs', () => {
      process.env.PUBLIC_BASE_URL = 'https://coffeeshop.kh/';
      expect(buildCanonicalProductUrl(12)).toBe('https://coffeeshop.kh/products/12');
      expect(buildCanonicalProductUrl(undefined, 'https://coffeeshop.kh/products/12?ref=fb#section')).toBe(
        'https://coffeeshop.kh/products/12',
      );
    });
  });

  describe('Robots and Deploy Context', () => {
    it('marks non-production Netlify deploys (deploy-preview, branch-deploy) as not indexable', () => {
      process.env.CONTEXT = 'deploy-preview';
      expect(isProductionDeploy()).toBe(false);
      expect(getRobotsDirective()).toEqual({
        index: false,
        follow: false,
        nocache: true,
      });

      const robotsResult = robots();
      expect(robotsResult.rules).toEqual({
        userAgent: '*',
        disallow: '/',
      });
    });

    it('allows public paths and disallows private/api paths on production Netlify deploys', () => {
      process.env.CONTEXT = 'production';
      process.env.PUBLIC_BASE_URL = 'https://coffeeshop.kh';
      expect(isProductionDeploy()).toBe(true);
      expect(getRobotsDirective()).toEqual({
        index: true,
        follow: true,
      });

      const robotsResult = robots();
      expect(robotsResult.sitemap).toBe('https://coffeeshop.kh/sitemap.xml');
      const rules = robotsResult.rules;
      expect(Array.isArray(rules)).toBe(false);
      if (!Array.isArray(rules)) {
        expect(rules.allow).toContain('/');
        expect(rules.allow).toContain('/products');
        expect(rules.disallow).toContain('/api');
        expect(rules.disallow).toContain('/checkout');
        expect(rules.disallow).toContain('/orders');
        expect(rules.disallow).toContain('/login');
      }
    });

    it('ensures private route layouts strictly declare noindex and nofollow', () => {
      const privateDirective = getPrivateRobotsDirective();
      expect(privateDirective).toEqual({ index: false, follow: false });

      expect(authMetadata.robots).toEqual(privateDirective);
      expect(checkoutMetadata.robots).toEqual(privateDirective);
      expect(ordersMetadata.robots).toEqual(privateDirective);
      expect(dashboardMetadata.robots).toEqual(privateDirective);
      expect(categoriesMetadata.robots).toEqual(privateDirective);
      expect(usersMetadata.robots).toEqual(privateDirective);
    });
  });

  describe('Sitemap generation', () => {
    it('generates public static routes and active product routes, excluding private pages', async () => {
      process.env.PUBLIC_BASE_URL = 'https://coffeeshop.kh';
      process.env.INTERNAL_API_BASE_URL = 'http://kong:8000';

      const mockProducts = [
        {
          id: 1,
          name: 'Iced Latte',
          is_active: true,
          images: [{ created_at: '2026-01-01T10:00:00Z' }],
        },
        {
          id: 2,
          name: 'Inactive Drink',
          is_active: false,
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { items: mockProducts } }),
      }) as unknown as typeof fetch;

      const items = await sitemap();
      const urls = items.map((i) => i.url);

      expect(urls).toContain('https://coffeeshop.kh/');
      expect(urls).toContain('https://coffeeshop.kh/products');
      expect(urls).toContain('https://coffeeshop.kh/products/1');
      expect(urls).not.toContain('https://coffeeshop.kh/products/2');
      expect(urls).not.toContain('https://coffeeshop.kh/login');
      expect(urls).not.toContain('https://coffeeshop.kh/checkout');
      expect(urls).not.toContain('https://coffeeshop.kh/orders');
    });

    it('falls back gracefully to static routes when product API is unreachable', async () => {
      process.env.PUBLIC_BASE_URL = 'https://coffeeshop.kh';
      global.fetch = vi.fn().mockRejectedValue(new Error('Network down')) as unknown as typeof fetch;

      const items = await sitemap();
      expect(items).toHaveLength(2);
      expect(items[0].url).toBe('https://coffeeshop.kh/');
      expect(items[1].url).toBe('https://coffeeshop.kh/products');
    });
  });

  describe('JSON-LD Serialization', () => {
    it('escapes < characters to prevent XSS script injection in LD+JSON', () => {
      const maliciousData = {
        name: 'Coffee</script><script>alert(1)</script>',
        price: '3.50',
      };
      const serialized = safeJsonLdStringify(maliciousData);
      expect(serialized).not.toContain('</script>');
      expect(serialized).toContain('\\u003c/script>');

      const parsed = JSON.parse(serialized);
      expect(parsed.name).toBe('Coffee</script><script>alert(1)</script>');
    });
  });
});
