import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { SESSION_COOKIE_NAME } from '@/constants/auth';
import { sanitizeNextPath } from '@/utils/safeNextPath';

/**
 * Edge-level, coarse-grained gate only: "does a session exist at all".
 * It does NOT decode or verify the JWT (that would require shipping the
 * shared JWT_SECRET_KEY to the edge/frontend, which the backend never
 * should) and it does NOT do role-based gating - that's RoleGuard's job,
 * client-side, once we've actually fetched the verified user via
 * GET /user/me. This just avoids flashing protected content before client
 * JS has a chance to redirect.
 */
const PROTECTED_PREFIXES = [
  '/checkout',
  '/dashboard',
  '/orders',
  '/users',
  '/reports',
  '/categories',
];
const PUBLIC_ONLY_PATHS = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);
  const { pathname, search } = request.nextUrl;

  // Products and the shop are publicly browseable, while checkout, orders,
  // account/users, and staff product management require authentication.
  const isProductAdminOnly = pathname === '/products/new' || pathname.endsWith('/edit');
  const isProtected =
    isProductAdminOnly ||
    PROTECTED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
  const isPublicOnly = PUBLIC_ONLY_PATHS.includes(pathname);

  if (isProtected && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    const requestedPath = sanitizeNextPath(`${pathname}${search}`, '/products');
    loginUrl.searchParams.set('next', requestedPath);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicOnly && hasSession) {
    const rawNext =
      request.nextUrl.searchParams.get('next') || request.nextUrl.searchParams.get('redirect');
    const safeTarget = sanitizeNextPath(rawNext, '/products');
    return NextResponse.redirect(new URL(safeTarget, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/checkout/:path*',
    '/dashboard/:path*',
    '/products/:path*',
    '/categories/:path*',
    '/orders/:path*',
    '/users/:path*',
    '/reports/:path*',
    '/login',
    '/register',
  ],
};
