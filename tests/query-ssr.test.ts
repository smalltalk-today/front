// @vitest-environment node
import { dehydrate, hydrate } from '@tanstack/react-query';
import { expect, it } from 'vitest';
import { getQueryClient } from '@/shared/lib/query';

it('creates a QueryClient per server request and reuses hydrated fresh data', async () => {
  const first = getQueryClient();
  const second = getQueryClient();
  expect(first).not.toBe(second);
  const options = { queryKey: ['profile'], queryFn: async () => ({ name: 'private' }) };
  await first.fetchQuery(options);
  expect(second.getQueryData(options.queryKey)).toBeUndefined();
  hydrate(second, dehydrate(first));
  expect(
    await second.fetchQuery({
      ...options,
      queryFn: async () => {
        throw new Error('fresh cache must prevent this request');
      },
    }),
  ).toEqual({ name: 'private' });
});
