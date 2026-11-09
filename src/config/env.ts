import { z } from 'zod';

/**
 * All frontend requests route through Kong Gateway (APIM) as the single
 * unified API entry point (port 8000 by default).
 */
const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  INTERNAL_API_BASE_URL: z.string().url().optional(),
});

function loadEnv() {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
    INTERNAL_API_BASE_URL: process.env.INTERNAL_API_BASE_URL || 'http://kong:8000',
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
