'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { Spinner } from '@/components/ui/spinner';
import { useCurrentUser } from '@/features/auth/hooks';
import { getAccessToken } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';
import { buildLoginUrl } from '@/utils/safeNextPath';

/**
 * Mounted once inside the (dashboard) layout. Bridges "a session cookie
 * exists" (middleware's fast, coarse check) with "we've actually confirmed
 * the token is still valid and know who the user is" (GET /user/me).
 *
 * Public product catalog (/products) and product detail pages (/products/[id])
 * are accessible without logging in so guests can browse and add items to cart.
 */
export function SessionBootstrap({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);

  const { isPending, isError } = useCurrentUser();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const hasToken = hydrated && getAccessToken() !== null;

  const isPublicProductView =
    pathname === '/products' ||
    (pathname.startsWith('/products/') &&
      !pathname.endsWith('/edit') &&
      pathname !== '/products/new');

  useEffect(() => {
    if (!hydrated) return;
    if (isError) {
      clearAuth();
      if (!isPublicProductView) {
        router.replace(buildLoginUrl(pathname));
      }
      return;
    }
    if (!hasToken && !user && !isPublicProductView) {
      router.replace(buildLoginUrl(pathname));
    }
  }, [hydrated, isError, hasToken, user, clearAuth, router, isPublicProductView, pathname]);

  if (isPublicProductView) {
    return <>{children}</>;
  }

  if (!hydrated || (!user && hasToken && isPending)) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Spinner label="Checking your session..." />
      </div>
    );
  }

  if (isError || (!hasToken && !user)) {
    return null;
  }

  return <>{children}</>;
}
