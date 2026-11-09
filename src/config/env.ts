import { z } from 'zod';

/**
 * All frontend requests route through Kong Gateway (APIM) as the single
 * unified API entry point (port 8000 by default).
 */
const envSchema = z.object({
  // When empty or omitted, client browser calls same-origin relative URLs (/api/..., /media/...)
  NEXT_PUBLIC_API_BASE_URL: z.string().url().or(z.literal('')).default(''),
  INTERNAL_API_BASE_URL: z.string().url().optional(),
  KONG_INTERNAL_URL: z.string().url().optional(),
});

function loadEnv() {
  const isDev = process.env.NODE_ENV !== 'production';
  const defaultApiBase = isDev ? 'http://localhost:8000' : '';
  const rawApiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL !== undefined
      ? process.env.NEXT_PUBLIC_API_BASE_URL
      : defaultApiBase;

  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_API_BASE_URL: rawApiBase,
    INTERNAL_API_BASE_URL:
      process.env.INTERNAL_API_BASE_URL ||
      process.env.KONG_INTERNAL_URL ||
      (isDev ? 'http://localhost:8000' : 'http://kong:8000'),
    KONG_INTERNAL_URL: process.env.KONG_INTERNAL_URL,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Invalid or missing environment variables:\n${issues}\n\nDid you copy .env.local.example to .env.local?`,
    );
  }

  return parsed.data;
}

export const env = loadEnv();
