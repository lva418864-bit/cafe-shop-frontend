'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Spinner } from '@/components/ui/spinner';
import { ROUTES } from '@/constants/routes';
import { hasAnyRole } from '@/constants/roles';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    // Guests and customers land directly on the public shop catalog (/products);
    // staff/admin go to /dashboard once hydrated.
    const landing = hasAnyRole(user?.role, ['admin', 'staff']) ? ROUTES.DASHBOARD : ROUTES.PRODUCTS;
    router.replace(landing);
  }, [router, user]);

  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <Spinner label="Redirecting..." />
    </div>
  );
}
