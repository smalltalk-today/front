import type { z } from 'zod';

export interface HttpError extends Error {
  status: number;
}

export async function request<T>(
  url: string,
  schema: z.ZodType<T>,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error: HttpError = Object.assign(new Error(`요청 실패 (${response.status})`), {
      status: response.status,
    });
    throw error;
  }
  const data: unknown = await response.json();
  return schema.parse(data);
}
