import axios, { type AxiosInstance } from 'axios';

import { env } from '@/config/env';
import { attachInterceptors } from '@/services/interceptor';

const REQUEST_TIMEOUT_MS = 15000;

function resolveBaseUrl(): string {
  // When running server-side (e.g. Next.js SSR / Server Actions) inside a container,
  // localhost would resolve to the frontend container itself. We must call Kong via
  // the Docker network service name http://kong:8000. In client browser, use localhost:8000.
  if (typeof window === 'undefined') {
    return env.INTERNAL_API_BASE_URL || 'http://kong:8000';
  }
  return env.NEXT_PUBLIC_API_BASE_URL;
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
