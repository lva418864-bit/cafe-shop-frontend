import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateMetadata } from '@/app/(dashboard)/products/[id]/page';
import { GET as getOgDefault } from '@/app/og-default/route';

describe('Step 3: Social Link Previews (Telegram & Facebook)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.PUBLIC_BASE_URL = 'https://coffeeshop.kh';
    process.env.INTERNAL_API_BASE_URL = 'http://kong:8000';
    delete process.env.NEXT_PUBLIC_FB_APP_ID;
  });

  it('generates all required Open Graph and Twitter card tags on product pages', async () => {
    const mockProduct = {
      id: 42,
      name: 'Iced Americano',
      description: 'Bold espresso poured over ice and purified water.',
      price: '2.75',
      category: { id: 1, name: 'Cold Coffee' },
      is_active: true,
      stock_quantity: 20,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: mockProduct }),
    }) as unknown as typeof fetch;

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: '42' }),
    });

    // Canonical & Basic
    expect(metadata.alternates?.canonical).toBe('https://coffeeshop.kh/products/42');

    // Open Graph
    const og = metadata.openGraph;
    expect(og).toBeDefined();
    expect(og?.title).toBe('Iced Americano | Coffee Shop');
    expect(og?.description).toContain('$2.75');
    expect(og?.url).toBe('https://coffeeshop.kh/products/42');
    expect(og?.siteName).toBe('Coffee Shop');
    expect(og && 'locale' in og ? og.locale : undefined).toBe('en_US');
    expect(og?.images).toEqual([
      expect.objectContaining({
        url: 'https://coffeeshop.kh/products/42/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Iced Americano',
      }),
    ]);

    // Other tags: og:type=product, product:price:amount, product:price:currency
    const other = metadata.other as Record<string, string>;
    expect(other).toBeDefined();
    expect(other['og:type']).toBe('product');
    expect(other['product:price:amount']).toBe('2.75');
    expect(other['product:price:currency']).toBe('USD');
    expect(other['fb:app_id']).toBeUndefined();

    // Twitter card
    const twitter = metadata.twitter;
    expect(twitter).toBeDefined();
    expect(twitter && 'card' in twitter ? twitter.card : undefined).toBe('summary_large_image');
    expect(twitter?.images).toEqual(['https://coffeeshop.kh/products/42/opengraph-image']);
  });

  it('includes fb:app_id only when NEXT_PUBLIC_FB_APP_ID is set', async () => {
    process.env.NEXT_PUBLIC_FB_APP_ID = '123456789012345';

    const mockProduct = {
      id: 10,
      name: 'Croissant',
      price: '2.00',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: mockProduct }),
    }) as unknown as typeof fetch;

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: '10' }),
    });

    const other = metadata.other as Record<string, string>;
    expect(other['fb:app_id']).toBe('123456789012345');
  });

  it('serves dynamic default 1200x630 fallback image via /og-default', async () => {
    const res = await getOgDefault();
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('image/png');
    expect(res.headers.get('cache-control')).toContain('public');
  });
});
