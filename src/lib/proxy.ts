import { type NextRequest, NextResponse } from 'next/server';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
]);

const FORWARDED_RESPONSE_HEADERS = [
  'content-type',
  'content-length',
  'cache-control',
  'etag',
  'last-modified',
  'expires',
  'content-disposition',
  'x-content-type-options',
  'x-request-id',
  'ratelimit-limit',
  'ratelimit-remaining',
  'ratelimit-reset',
  'x-ratelimit-limit-minute',
  'x-ratelimit-remaining-minute',
  'access-control-allow-origin',
  'access-control-allow-credentials',
  'access-control-allow-methods',
  'access-control-allow-headers',
  'access-control-expose-headers',
];

export function getKongInternalUrl(): string {
  const url =
    process.env.KONG_INTERNAL_URL ||
    process.env.INTERNAL_API_BASE_URL ||
    'http://localhost:8000';
  return url.replace(/\/$/, '');
}

/**
 * Server-side reverse proxy from Next.js to Kong Gateway.
 * Evaluates KONG_INTERNAL_URL dynamically on every request at runtime.
 */
export async function proxyToKong(req: NextRequest): Promise<Response> {
  const kongBase = getKongInternalUrl();
  const incomingUrl = req.nextUrl;
  const targetUrl = `${kongBase}${incomingUrl.pathname}${incomingUrl.search}`;

  // Build forward headers
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (!HOP_BY_HOP_HEADERS.has(lowerKey)) {
      headers.set(key, value);
    }
  });

  // Client IP & host forwarding
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  headers.set('x-forwarded-for', clientIp);
  headers.set('x-forwarded-proto', incomingUrl.protocol.replace(':', '') || 'https');
  headers.set('x-forwarded-host', req.headers.get('host') || incomingUrl.host);

  // Method & streaming body
  const method = req.method.toUpperCase();
  const hasBody = method !== 'GET' && method !== 'HEAD' && req.body !== null;

  const init: RequestInit & { duplex?: 'half' } = {
    method,
    headers,
    redirect: 'manual',
    signal: AbortSignal.timeout(35000),
  };

  if (hasBody) {
    init.body = req.body;
    init.duplex = 'half';
  }

  try {
    const upstreamRes = await fetch(targetUrl, init);

    const resHeaders = new Headers();
    FORWARDED_RESPONSE_HEADERS.forEach((h) => {
      const val = upstreamRes.headers.get(h);
      if (val !== null) {
        resHeaders.set(h, val);
      }
    });

    // Also forward any custom headers not explicitly listed but safe
    upstreamRes.headers.forEach((val, key) => {
      const lower = key.toLowerCase();
      if (!HOP_BY_HOP_HEADERS.has(lower) && !resHeaders.has(key)) {
        resHeaders.set(key, val);
      }
    });

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      statusText: upstreamRes.statusText,
      headers: resHeaders,
    });
  } catch (error: unknown) {
    const err = error as Error;
    const isTimeout = err?.name === 'TimeoutError' || err?.message?.includes('timeout');
    const status = isTimeout ? 504 : 502;
    const message = isTimeout
      ? 'Gateway Timeout: upstream Kong did not respond in time'
      : 'Bad Gateway: unable to connect to Kong Gateway';

    return NextResponse.json(
      {
        success: false,
        error_code: isTimeout ? 'err_504_gateway_timeout' : 'err_502_bad_gateway',
        message,
      },
      { status },
    );
  }
}
