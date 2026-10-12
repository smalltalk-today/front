import 'server-only';
import { getServerEnv } from '@/shared/config/index.server';
import { request } from './index';
import type { z } from 'zod';

export function serverRequest<T>(path: string, schema: z.ZodType<T>, options?: RequestInit) {
  const { apiBaseUrl } = getServerEnv();
  if (!apiBaseUrl) throw new Error('서버 API_BASE_URL이 필요합니다.');
  return request(new URL(path, apiBaseUrl).toString(), schema, options);
}
