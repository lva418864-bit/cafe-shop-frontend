export function containsKhmerText(text?: string | null): boolean {
  return /[\u1780-\u17FF\u19E0-\u19FF]/.test(text || '');
}

export function buildProductOgDescription(product: {
  name: string;
  description?: string | null;
  price?: string | number;
}): string {
  const numericPrice = Number(product.price ?? 0);
  const priceText = Number.isFinite(numericPrice) ? `$${numericPrice.toFixed(2)}` : '';
  const body =
    typeof product.description === 'string' && product.description.trim()
      ? product.description.trim()
      : `Order ${product.name} at Coffee Shop. Fast, seamless payments via Bakong KHQR.`;
  const combined = priceText ? `${priceText} — ${body}` : body;
  return combined.length > 150 ? `${combined.slice(0, 147).trimEnd()}...` : combined;
}

export interface ResolvedOgImage {
  url: string;
  width: number;
  height: number;
  alt: string;
}

/**
 * Resolves the Open Graph preview image following the 3-tier fallback order:
 * 1. Dynamic 1200x630 card image (`/products/<id>/opengraph-image`)
 * 2. Product's primary uploaded image as an absolute URL (used when Khmer glyphs
 *    are present or dynamic card generation is bypassed)
 * 3. Default shop image in `public/` (`/images/product-og.png`)
 */
export function resolveProductOgImage(
  product: {
    id?: number | string;
    name: string;
    description?: string | null;
    image_url?: string | null;
    image_alt?: string | null;
    images?: Array<{ width?: number | null; height?: number | null }> | null;
  },
  baseUrl: string,
  id: string,
  options?: { preferDynamicCard?: boolean },
): ResolvedOgImage {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const ogAlt =
    (typeof product.image_alt === 'string' && product.image_alt.trim()) || product.name;
  const preferDynamic = options?.preferDynamicCard ?? true;
  const hasKhmer =
    containsKhmerText(product.name) || containsKhmerText(product.description);

  // Tier 1: Dynamic 1200x630 Open Graph card route
  if (preferDynamic && !hasKhmer) {
    return {
      url: `${cleanBase}/products/${encodeURIComponent(id)}/opengraph-image`,
      width: 1200,
      height: 630,
      alt: ogAlt,
    };
  }

  // Tier 2: Product's primary uploaded image as an absolute URL
  const rawImageUrl =
    typeof product.image_url === 'string' && product.image_url.trim()
      ? product.image_url.trim()
      : null;
  if (rawImageUrl) {
    const resolvedPrimaryUrl =
      rawImageUrl.startsWith('http://') || rawImageUrl.startsWith('https://')
        ? rawImageUrl
        : `${cleanBase}${rawImageUrl.startsWith('/') ? rawImageUrl : `/${rawImageUrl}`}`;
    const primaryMeta = Array.isArray(product.images) ? product.images[0] : null;
    const width =
      primaryMeta && typeof primaryMeta.width === 'number' ? primaryMeta.width : 1200;
    const height =
      primaryMeta && typeof primaryMeta.height === 'number' ? primaryMeta.height : 630;
    return {
      url: resolvedPrimaryUrl,
      width,
      height,
      alt: ogAlt,
    };
  }

  // Tier 3: Default shop image in public/images/product-og.png
  return {
    url: `${cleanBase}/images/product-og.png`,
    width: 1200,
    height: 630,
    alt: ogAlt,
  };
}
