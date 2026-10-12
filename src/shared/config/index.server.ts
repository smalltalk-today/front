import 'server-only';
import { z } from 'zod';

const serverEnvSchema = z.object({
  SITE_URL: z.url().default('http://localhost:3000'),
  API_BASE_URL: z.url().optional(),
});

export function getServerEnv() {
  const env = serverEnvSchema.parse({
    SITE_URL: process.env.SITE_URL,
    API_BASE_URL: process.env.API_BASE_URL,
  });
  if (process.env.NEXT_PUBLIC_APP_ENV === 'production' && !process.env.SITE_URL) {
    throw new Error('production 환경에는 SITE_URL이 필요합니다.');
  }
  return { siteUrl: env.SITE_URL, apiBaseUrl: env.API_BASE_URL };
}
