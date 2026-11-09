import type { AxiosInstance } from 'axios';

import { clearSession, getAccessToken } from '@/services/auth';
import { normalizeAxiosError } from '@/services/apiError';

/**
 * The backend has no refresh-token endpoint (confirmed in Step 1 - tokens
 * just expire after JWT_ACCESS_TOKEN_EXPIRE_MINUTES). So a 401 here does
 * NOT attempt a silent refresh; it clears the stored token and rejects with
 * a normalized ApiError, and Step 6's session logic (a query/mutation
 * `onError`, or a root-level effect watching for status 401) is what
 * actually redirects to /login. Attempting an invisible retry against a
 * nonexistent refresh endpoint would only mask the real problem.
 */
export function attachInterceptors(client: AxiosInstance): AxiosInstance {
  client.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      const apiError = normalizeAxiosError(error);
      if (apiError.status === 401) {
        clearSession();
      }
      return Promise.reject(apiError);
    },
  );

  return client;
}
