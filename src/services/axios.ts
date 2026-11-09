import axios, { type AxiosInstance } from 'axios';

import { env } from '@/config/env';
import { attachInterceptors } from '@/services/interceptor';

const REQUEST_TIMEOUT_MS = 15000;

function resolveBaseUrl(): string {
  // When running server-side (e.g. Next.js SSR / Server Actions / Route Handlers),
  // call Kong via KONG_INTERNAL_URL or INTERNAL_API_BASE_URL. In browser, use NEXT_PUBLIC_API_BASE_URL
  // or relative paths (empty string) for same-origin proxy.
  if (typeof window === 'undefined') {
    return (
      process.env.KONG_INTERNAL_URL ||
      process.env.INTERNAL_API_BASE_URL ||
      env.INTERNAL_API_BASE_URL ||
      'http://kong:8000'
    );
  }
  return env.NEXT_PUBLIC_API_BASE_URL || '';
}

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: resolveBaseUrl(),
    timeout: REQUEST_TIMEOUT_MS,
    headers: { 'Content-Type': 'application/json' },
  });
  return attachInterceptors(client);
}

// Single unified API Gateway Client pointing to Kong APIM:
export const apiClient = createApiClient();

// Microservice client aliases routing through Kong Gateway:
export const authClient = apiClient;
export const operationClient = apiClient;
export const reportClient = apiClient;
