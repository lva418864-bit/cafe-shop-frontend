/**
 * Site URL and SEO configuration helpers.
 * Handles environment-based URL resolution (Netlify, production, local dev)
 * and indexation directives based on deploy context.
 */

export function getSiteUrl(): string {
  const envUrl =
    process.env.PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.URL ||
    (typeof window !== 'undefined' ? window.location.origin : '') ||
    'http://localhost:3000';

  const trimmed = envUrl.trim().replace(/\/+$/, '');
  if (!trimmed) {
    return 'http://localhost:3000';
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

/**
 * Determines whether the current deployment should be indexed by search engines.
 * Netlify sets the CONTEXT variable:
 * - 'production': production branch build -> INDEXABLE
 * - 'deploy-preview' / 'branch-deploy': preview builds -> MUST NOT BE INDEXED
 */
export function isProductionDeploy(): boolean {
  const netlifyContext = process.env.CONTEXT;
  if (netlifyContext) {
    return netlifyContext === 'production';
  }

  // Fallback when outside Netlify: check NODE_ENV or default to local non-prod
  return process.env.NODE_ENV === 'production';
}

/**
 * Returns the robots directive for public pages.
 * In non-production environments (e.g. Netlify deploy previews, branch deploys),
 * all pages are instructed not to be indexed or followed.
 */
export function getRobotsDirective(): {
  index: boolean;
  follow: boolean;
  nocache?: boolean;
} {
  if (!isProductionDeploy()) {
    return {
      index: false,
      follow: false,
      nocache: true,
    };
  }

  return {
    index: true,
    follow: true,
  };
}

/**
 * Returns robots directive for private pages (login, register, orders, checkout, dashboard, etc.)
 * Always noindex, nofollow regardless of deploy context.
 */
export function getPrivateRobotsDirective(): {
  index: false;
  follow: false;
} {
  return {
    index: false,
    follow: false,
  };
}

/**
 * Resolves an absolute URL given a relative path.
 */
export function absoluteUrl(path: string = ''): string {
  const base = getSiteUrl();
  const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  return `${base}${cleanPath}`;
}

/**
 * Generates a clean canonical product URL without query params or fragment.
 */
export function buildCanonicalProductUrl(
  productId?: number | string,
  explicitUrl?: string,
): string {
  if (explicitUrl && explicitUrl.trim()) {
    const withoutQuery = explicitUrl.trim().split('?')[0] ?? '';
    const cleanExplicit = withoutQuery.split('#')[0] ?? '';
    return cleanExplicit.replace(/\/+$/, '');
  }

  const base = getSiteUrl();
  if (productId !== undefined && productId !== null && String(productId).trim() !== '') {
    return `${base}/products/${encodeURIComponent(String(productId).trim())}`;
  }

  if (typeof window !== 'undefined') {
    return `${base}${window.location.pathname}`.replace(/\/+$/, '');
  }

  return base;
}
