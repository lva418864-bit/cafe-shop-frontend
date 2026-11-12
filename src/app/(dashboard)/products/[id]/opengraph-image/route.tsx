import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;
const CACHE_CONTROL = 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400';

interface RouteContext {
  params: Promise<{ id: string }>;
}

function containsKhmerScript(text?: string | null): boolean {
  return /[\u1780-\u17FF\u19E0-\u19FF]/.test(text || '');
}

async function serveDefaultFallbackImage(): Promise<Response> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'images', 'product-og.png');
    const bytes = await readFile(filePath);
    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': CACHE_CONTROL,
      },
    });
  } catch {
    return new Response('Image not available', { status: 404 });
  }
}

export async function GET(_request: Request, { params }: RouteContext): Promise<Response> {
  const { id } = await params;
  const internalApi = (
    process.env.INTERNAL_API_BASE_URL ||
    process.env.KONG_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://kong:8000'
  ).replace(/\/$/, '');

  let product: {
    id: number;
    name: string;
    description?: string | null;
    price: string | number;
    image_url?: string | null;
    category?: { name?: string | null } | null;
  } | null = null;

  try {
    const res = await fetch(`${internalApi}/api/products/${encodeURIComponent(id)}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return new Response('Product not found', { status: 404 });
    }
    const payload = await res.json();
    product = payload?.data ?? null;
  } catch {
    return serveDefaultFallbackImage();
  }

  if (!product) {
    return new Response('Product not found', { status: 404 });
  }

  // Fetch product photo from INTERNAL media URL (service name inside Docker)
  let photoBytes: ArrayBuffer | null = null;
  let photoContentType = 'image/jpeg';
  let photoDataUri: string | null = null;

  const rawImageUrl =
    typeof product.image_url === 'string' && product.image_url.trim()
      ? product.image_url.trim()
      : null;

  if (rawImageUrl) {
    const internalMediaUrl =
      rawImageUrl.startsWith('http://') || rawImageUrl.startsWith('https://')
        ? rawImageUrl
        : `${internalApi}${rawImageUrl.startsWith('/') ? rawImageUrl : `/${rawImageUrl}`}`;

    try {
      const mediaRes = await fetch(internalMediaUrl, { cache: 'no-store' });
      if (mediaRes.ok) {
        photoContentType = mediaRes.headers.get('content-type') || 'image/jpeg';
        photoBytes = await mediaRes.arrayBuffer();
        if (
          photoBytes.byteLength > 0 &&
          photoBytes.byteLength <= 2_500_000 &&
          (photoContentType.includes('jpeg') ||
            photoContentType.includes('jpg') ||
            photoContentType.includes('png'))
        ) {
          const base64 = Buffer.from(photoBytes).toString('base64');
          photoDataUri = `data:${photoContentType};base64,${base64}`;
        }
      }
    } catch {
      // Proceed without embedded photo if internal media fetch fails
    }
  }

  // If product text uses Khmer script (default ImageResponse font lacks Khmer glyphs)
  // or the uploaded image is WebP, fall back to the primary image bytes or default image.
  if (containsKhmerScript(product.name) || containsKhmerScript(product.description)) {
    if (photoBytes) {
      return new Response(photoBytes, {
        status: 200,
        headers: {
          'Content-Type': photoContentType,
          'Cache-Control': CACHE_CONTROL,
        },
      });
    }
    return serveDefaultFallbackImage();
  }

  const formattedPrice = `$${Number(product.price ?? 0).toFixed(2)}`;
  const categoryName = product.category?.name || 'Freshly Crafted';
  const rawDescription =
    typeof product.description === 'string' && product.description.trim()
      ? product.description.trim()
      : `Order ${product.name} at Coffee Shop with instant Bakong KHQR checkout.`;
  const shortDescription =
    rawDescription.length > 110
      ? `${rawDescription.slice(0, 107).trimEnd()}...`
      : rawDescription;
  const displayTitle =
    product.name.length > 42 ? `${product.name.slice(0, 39).trimEnd()}...` : product.name;

  try {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '56px',
            backgroundColor: '#1f150f',
            color: '#faf6f0',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Left: Product Photo or Coffee Emblem */}
          <div
            style={{
              width: '460px',
              height: '518px',
              borderRadius: '28px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#2b1d15',
              border: '2px solid rgba(245, 158, 11, 0.3)',
              flexShrink: 0,
            }}
          >
            {photoDataUri ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoDataUri}
                alt={product.name}
                width={460}
                height={518}
                style={{
                  width: '460px',
                  height: '518px',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  color: '#d97706',
                }}
              >
                <div
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '60px',
                    background: 'rgba(217, 119, 6, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '56px',
                    fontWeight: 700,
                  }}
                >
                  ☕
                </div>
                <span style={{ fontSize: '22px', color: '#d6c7b8' }}>Coffee Shop</span>
              </div>
            )}
          </div>

          {/* Right: Shop Brand, Title, Description, Price */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '518px',
              flex: 1,
              paddingLeft: '48px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    color: '#fbbf24',
                  }}
                >
                  COFFEE SHOP
                </span>
                <span style={{ color: '#785a46', fontSize: '18px' }}>•</span>
                <span
                  style={{
                    fontSize: '16px',
                    padding: '4px 14px',
                    borderRadius: '999px',
                    background: 'rgba(251, 191, 36, 0.14)',
                    color: '#fde68a',
                  }}
                >
                  {categoryName}
                </span>
              </div>

              <div
                style={{
                  fontSize: '54px',
                  fontWeight: 700,
                  lineHeight: 1.15,
                  color: '#faf6f0',
                }}
              >
                {displayTitle}
              </div>

              <div
                style={{
                  fontSize: '24px',
                  lineHeight: 1.45,
                  color: '#d6c7b8',
                }}
              >
                {shortDescription}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '24px',
                borderTop: '1px solid rgba(250, 246, 240, 0.14)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '16px', color: '#a89078', textTransform: 'uppercase' }}>
                  Price
                </span>
                <span
                  style={{
                    fontSize: '46px',
                    fontWeight: 700,
                    color: '#fbbf24',
                  }}
                >
                  {formattedPrice}
                </span>
              </div>

              <div
                style={{
                  padding: '14px 26px',
                  borderRadius: '14px',
                  background: '#d97706',
                  color: '#fffbeb',
                  fontSize: '20px',
                  fontWeight: 700,
                }}
              >
                Order Now • KHQR
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        headers: {
          'Cache-Control': CACHE_CONTROL,
        },
      },
    );
  } catch {
    if (photoBytes) {
      return new Response(photoBytes, {
        status: 200,
        headers: {
          'Content-Type': photoContentType,
          'Cache-Control': CACHE_CONTROL,
        },
      });
    }
    return serveDefaultFallbackImage();
  }
}
