import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resolveProductOgImage,
  buildProductOgDescription,
} from '@/features/product/metadata';
import { generateMetadata } from '../page';

describe('Product Page Server Metadata Generation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.PUBLIC_BASE_URL = 'https://coffeeshop.kh';
    process.env.INTERNAL_API_BASE_URL = 'http://kong:8000';
  });

  it('generates server Open Graph, Twitter, and canonical metadata with absolute URLs and price description', async () => {
    const mockProduct = {
      id: 5,
      name: 'Phnom Penh Dark Roast',
      description: 'Rich dark roast crafted with Mondulkiri beans.',
      price: '3.50',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: mockProduct }),
    }) as unknown as typeof fetch;

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: '5' }),
    });

    expect(metadata.title).toBe('Phnom Penh Dark Roast | Coffee Shop');
    expect(metadata.description).toBe('$3.50 — Rich dark roast crafted with Mondulkiri beans.');
    expect(metadata.alternates?.canonical).toBe('https://coffeeshop.kh/products/5');

    const og = metadata.openGraph;
    expect(og).toBeDefined();
    expect(og?.title).toBe('Phnom Penh Dark Roast | Coffee Shop');
    expect(og?.description).toBe('$3.50 — Rich dark roast crafted with Mondulkiri beans.');
    expect(og?.url).toBe('https://coffeeshop.kh/products/5');
    expect(og?.siteName).toBe('Coffee Shop');
    expect(og && 'locale' in og ? og.locale : undefined).toBe('en_US');
    expect(og?.images).toEqual([
      expect.objectContaining({
        url: 'https://coffeeshop.kh/products/5/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Phnom Penh Dark Roast',
      }),
    ]);

    const twitter = metadata.twitter;
    expect(twitter).toBeDefined();
    expect(twitter && 'card' in twitter ? twitter.card : undefined).toBe('summary_large_image');
    expect(twitter?.title).toBe('Phnom Penh Dark Roast | Coffee Shop');
    expect(twitter?.description).toBe('$3.50 — Rich dark roast crafted with Mondulkiri beans.');
    expect(twitter?.images).toEqual(['https://coffeeshop.kh/products/5/opengraph-image']);
  });

  it('falls back in order: dynamic card -> primary product image (for Khmer text) -> default shop image', () => {
    const khmerProductWithImage = {
      id: 7,
      name: 'កាហ្វេទឹកដោះគោទឹកកក (Iced Latte)',
      description: 'Chilled espresso with condensed milk.',
      price: '2.50',
      image_url: '/api/media/a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4.jpg',
      image_alt: 'Tall glass of Iced Latte',
      images: [{ width: 1080, height: 1080 }],
    };

    const tier2 = resolveProductOgImage(khmerProductWithImage, 'https://coffeeshop.kh', '7');
    expect(tier2).toEqual({
      url: 'https://coffeeshop.kh/api/media/a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4.jpg',
      width: 1080,
      height: 1080,
      alt: 'Tall glass of Iced Latte',
    });

    const khmerProductWithoutImage = {
      id: 8,
      name: 'កាហ្វេខ្មៅ (Black Coffee)',
      description: null,
      price: '1.50',
      image_url: null,
      image_alt: null,
      images: [],
    };

    const tier3 = resolveProductOgImage(khmerProductWithoutImage, 'https://coffeeshop.kh', '8');
    expect(tier3).toEqual({
      url: 'https://coffeeshop.kh/images/product-og.png',
      width: 1200,
      height: 630,
      alt: 'កាហ្វេខ្មៅ (Black Coffee)',
    });
  });

  it('trims og:description to at most 150 characters', () => {
    const longDesc = 'A'.repeat(200);
    const result = buildProductOgDescription({
      name: 'Cold Brew',
      description: longDesc,
      price: '4.25',
    });
    expect(result.length).toBeLessThanOrEqual(150);
    expect(result.startsWith('$4.25 — ')).toBe(true);
    expect(result.endsWith('...')).toBe(true);
  });

  it('returns 404 metadata with no product Open Graph tags when the product does not exist', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ success: false }),
    }) as unknown as typeof fetch;

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: '999999' }),
    });

    expect(metadata.title).toBe('Product Not Found | Coffee Shop');
    expect(metadata.openGraph).toBeUndefined();
    expect(metadata.twitter).toBeUndefined();
    expect(metadata.alternates).toBeUndefined();
  });
});
