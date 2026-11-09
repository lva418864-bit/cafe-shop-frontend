/**
 * Validates and normalizes a `next` return path query parameter to prevent
 * open-redirect vulnerabilities.
 *
 * Rules enforced:
 * - Must be a relative path starting with a single `/`
 * - Rejects protocol-relative URLs (`//evil.com`), schemes (`http:`, `https:`,
 *   `javascript:`, `data:`, `vbscript:`), backslashes (`\`), control chars,
 *   and percent-encoded equivalents (`/%2fevil.com`, `/%5cevil`).
 * - Falls back to `fallback` (defaults to `/`) when invalid.
 */
export function sanitizeNextPath(
  next: string | null | undefined,
  fallback = '/',
): string {
  if (!next || typeof next !== 'string') {
    return fallback;
  }

  const raw = next.trim();
  if (!raw) {
    return fallback;
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return fallback;
  }

  for (const candidate of [raw, decoded]) {
    if (!candidate.startsWith('/')) {
      return fallback;
    }
    if (candidate.startsWith('//')) {
      return fallback;
    }
    if (candidate.includes('\\')) {
      return fallback;
    }
    if (/[\u0000-\u001f\u007f]/.test(candidate)) {
      return fallback;
    }
    const pathPart = candidate.split('?')[0]?.split('#')[0] ?? '';
    if (/[a-zA-Z][a-zA-Z0-9+.-]*:/i.test(pathPart)) {
      return fallback;
    }
  }

  try {
    const parsed = new URL(raw, 'http://localhost');
    if (parsed.origin !== 'http://localhost') {
      return fallback;
    }
    if (!parsed.pathname.startsWith('/') || parsed.pathname.startsWith('//')) {
      return fallback;
    }
    if (parsed.pathname.includes('\\')) {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

/**
 * Builds a `/login` URL with a validated `next` query parameter.
 */
export function buildLoginUrl(nextPath?: string | null): string {
  if (!nextPath) {
    return '/login';
  }
  const safe = sanitizeNextPath(nextPath, '');
  if (!safe || safe === '/login' || safe === '/register') {
    return '/login';
  }
  return `/login?next=${encodeURIComponent(safe)}`;
}
