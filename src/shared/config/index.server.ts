import 'server-only';
import { z } from 'zod';
import { appEnvSchema } from './schema';

const serverEnvSchema = z.object({
  NEXT_PUBLIC_APP_ENV: appEnvSchema,
  SITE_URL: z.url().default('http://localhost:3000'),
  API_BASE_URL: z.url().optional(),
});

export function getServerEnv() {
  const env = serverEnvSchema.parse({
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    SITE_URL: process.env.SITE_URL,
    API_BASE_URL: process.env.API_BASE_URL,
  });
  if (env.NEXT_PUBLIC_APP_ENV === 'product' && !process.env.SITE_URL) {
    throw new Error('product 환경에는 SITE_URL이 필요합니다.');
  }
  return { siteUrl: env.SITE_URL, apiBaseUrl: env.API_BASE_URL };
}
