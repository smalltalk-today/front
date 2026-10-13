import { z } from 'zod';
import { appEnvSchema } from './schema';

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_ENV: appEnvSchema,
  NEXT_PUBLIC_API_BASE_URL: z.url().optional(),
});

export function parseClientEnv(input: Record<string, unknown>) {
  const env = publicEnvSchema.parse(input);
  return {
    appEnv: env.NEXT_PUBLIC_APP_ENV,
    apiBaseUrl: env.NEXT_PUBLIC_API_BASE_URL,
  };
}

export function isMockEnabled(nodeEnv: string | undefined, appEnv: string | undefined) {
  return nodeEnv === 'development' && appEnv === 'develop';
}

export const clientEnv = parseClientEnv({
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

export function getApiUrl(path: string) {
  return clientEnv.apiBaseUrl ? new URL(path, clientEnv.apiBaseUrl).toString() : path;
}
