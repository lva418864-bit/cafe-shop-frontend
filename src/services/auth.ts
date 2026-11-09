import { ACCESS_TOKEN_STORAGE_KEY, SESSION_COOKIE_NAME } from '@/constants/auth';

/**
 * Low-level session persistence only - no React, no Zustand, no request
 * logic. Kept deliberately dumb so services/interceptor.ts can read the
 * token fresh on every request without importing React state, and so
 * store/authStore.ts has a single place to persist to/read from.
 *
 * Writes to BOTH localStorage (the real JWT, used by the axios interceptor)
 * and a lightweight presence cookie (used only by middleware.ts, which has
 * no access to localStorage). See constants/auth.ts for why the cookie
 * never holds the actual token.
 */
const FALLBACK_SESSION_MAX_AGE_SECONDS = 60 * 60; // used only if expiresInMinutes isn't known

export function getAccessToken(): string | null {
  try {
    if (typeof window === 'undefined' || typeof window.localStorage?.getItem !== 'function') {
      return null;
    }
    return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function persistSession(token: string, expiresInMinutes?: number): void {
  try {
    if (typeof window === 'undefined') return;
    if (typeof window.localStorage?.setItem === 'function') {
      window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
    }
    const maxAge = expiresInMinutes ? expiresInMinutes * 60 : FALLBACK_SESSION_MAX_AGE_SECONDS;
    document.cookie = `${SESSION_COOKIE_NAME}=1; path=/; max-age=${maxAge}; samesite=lax`;
  } catch {
    // Ignore storage errors
  }
}

export function clearSession(): void {
  try {
    if (typeof window === 'undefined') return;
    if (typeof window.localStorage?.removeItem === 'function') {
      window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    }
    document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
  } catch {
    // Ignore storage errors
  }
}
