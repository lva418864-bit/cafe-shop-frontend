import { env } from '@/config/env';

/**
 * Resolves a backend media path (such as `/api/media/<key>`) to a full URL
 * pointing to Kong Gateway in the browser while preserving absolute/blob URLs.
 */
export function resolveProductImageUrl(imageUrl?: string | null): string | null {
  if (!imageUrl) {
    return null;
  }
  const trimmed = imageUrl.trim();
  if (!trimmed) {
    return null;
  }
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }
  const baseUrl = (env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
}
