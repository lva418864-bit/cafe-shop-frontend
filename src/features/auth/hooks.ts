'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import * as authApi from '@/features/auth/api';
import type { CreateUserRequest, LoginRequest } from '@/features/auth/types';
import { queryKeys } from '@/constants/queryKeys';
import { ROUTES } from '@/constants/routes';
import { hasAnyRole } from '@/constants/roles';
import { useToast } from '@/hooks/useToast';
import type { ApiError } from '@/services/apiError';
import { getAccessToken } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';
import { buildLoginUrl, sanitizeNextPath } from '@/utils/safeNextPath';

function getRequestedNextPath(): string | null {
  if (typeof window === 'undefined') return null;
  const sp = new URLSearchParams(window.location.search);
  return sp.get('next') || sp.get('redirect');
}

export function useLogin() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: LoginRequest) => authApi.login(payload),
    onSuccess: (data) => {
      setSession(data.access_token, data.user, data.expires_in_minutes);
      toast({ title: `Welcome back, ${data.user.username}`, variant: 'success' });
      // Customers default to Products; staff/admin default to Dashboard unless a safe `next` path is present.
      const defaultLanding = hasAnyRole(data.user.role, ['admin', 'staff'])
        ? ROUTES.DASHBOARD
        : ROUTES.PRODUCTS;
      const target = sanitizeNextPath(getRequestedNextPath(), defaultLanding);
      router.push(target);
    },
    onError: (error: ApiError) => {
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
    },
  });
}

export function useRegister() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: CreateUserRequest) => {
      const createdUser = await authApi.register(payload);
      try {
        const loginData = await authApi.login({
          email: payload.email,
          password: payload.password,
        });
        return { createdUser, loginData };
      } catch {
        return { createdUser, loginData: null };
      }
    },
    onSuccess: ({ loginData }) => {
      const requestedNext = getRequestedNextPath();
      if (loginData) {
        setSession(loginData.access_token, loginData.user, loginData.expires_in_minutes);
        toast({
          title: `Welcome, ${loginData.user.username}!`,
          description: 'Your account is ready.',
          variant: 'success',
        });
        const target = sanitizeNextPath(requestedNext, ROUTES.PRODUCTS);
        router.push(target);
        return;
      }
      toast({
        title: 'Account created',
        description: 'You can now log in with your new account.',
        variant: 'success',
      });
      router.push(buildLoginUrl(requestedNext));
    },
    onError: (error: ApiError) => {
      toast({ title: 'Registration failed', description: error.message, variant: 'destructive' });
    },
  });
}

/**
 * Confirms the token in localStorage is still valid and hydrates the
 * current user. React Query v5 dropped per-query onSuccess/onError, so this
 * syncs authStore directly inside queryFn (fires once per successful
 * fetch/cache write) - error handling (expired/invalid token) is the
 * responsibility of the caller via the returned `isError` flag; see
 * SessionBootstrap, which is the only place this is actually called.
 */
export function useCurrentUser() {
  const setUser = useAuthStore((s) => s.setUser);
  const hasToken = typeof window !== 'undefined' && getAccessToken() !== null;

  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      const user = await authApi.getMe();
      setUser(user);
      return user;
    },
    enabled: hasToken,
    retry: false,
    staleTime: 5 * 60_000,
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return () => {
    clearAuth();
    queryClient.clear();
    router.push(ROUTES.PRODUCTS);
  };
}
