import { z } from 'zod';

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_ENV: z.enum(['local', 'staging', 'production']).default('local'),
  NEXT_PUBLIC_API_BASE_URL: z.url().optional(),
  NEXT_PUBLIC_MOCK_ENABLED: z.enum(['true', 'false']).default('false'),
});

export function parseClientEnv(input: Record<string, unknown>) {
  const env = publicEnvSchema.parse(input);
  return {
    appEnv: env.NEXT_PUBLIC_APP_ENV,
    apiBaseUrl: env.NEXT_PUBLIC_API_BASE_URL,
    mockEnabled: env.NEXT_PUBLIC_MOCK_ENABLED,
  };
}

export function isMockEnabled(nodeEnv: string | undefined, flag: string | undefined) {
  return nodeEnv === 'development' && flag === 'true';
}

export const clientEnv = parseClientEnv({
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_MOCK_ENABLED: process.env.NEXT_PUBLIC_MOCK_ENABLED,
});

export function getApiUrl(path: string) {
  return clientEnv.apiBaseUrl ? new URL(path, clientEnv.apiBaseUrl).toString() : path;
}
