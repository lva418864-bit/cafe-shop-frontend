import { ImageResponse } from 'next/og';
import { siteConfig } from '@/config/site';

export const runtime = 'edge';

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;
const CACHE_CONTROL = 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800';

export async function GET(): Promise<Response> {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1f150f',
          color: '#faf6f0',
          fontFamily: 'sans-serif',
          padding: '60px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '60px',
            backgroundColor: 'rgba(217, 119, 6, 0.2)',
            border: '2px solid rgba(251, 191, 36, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '56px',
            marginBottom: '28px',
          }}
        >
          ☕
        </div>

        <div
          style={{
            fontSize: '20px',
            fontWeight: 700,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: '#fbbf24',
            marginBottom: '12px',
          }}
        >
          {siteConfig.name}
        </div>

        <div
          style={{
            fontSize: '52px',
            fontWeight: 700,
            lineHeight: 1.2,
            maxWidth: '900px',
            marginBottom: '20px',
            color: '#faf6f0',
          }}
        >
          Specialty Coffee &amp; Bakery
        </div>

        <div
          style={{
            fontSize: '24px',
            color: '#d6c7b8',
            maxWidth: '800px',
            lineHeight: 1.4,
            marginBottom: '36px',
          }}
        >
          {siteConfig.description}
        </div>

        <div
          style={{
            padding: '12px 28px',
            borderRadius: '12px',
            background: '#d97706',
            color: '#fffbeb',
            fontSize: '20px',
            fontWeight: 700,
          }}
        >
          Instant Checkout with Bakong KHQR
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
}
