import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { request } from '@/shared/api';
import { createQueryClient, getQueryClient } from '@/shared/lib/query';
import { createUiStore } from '@/shared/lib/ui-store';
import { parseClientEnv, isMockEnabled } from '@/shared/config';

const server = setupServer();

describe('HTTP trust boundary', () => {
  it('validates API data and preserves HTTP status', async () => {
    server.listen({ onUnhandledRequest: 'error' });
    try {
      server.use(
        http.get('https://example.test/items', () => HttpResponse.json({ name: 'hello' })),
      );
      expect(await request('https://example.test/items', z.object({ name: z.string() }))).toEqual({
        name: 'hello',
      });
      server.use(http.get('https://example.test/items', () => HttpResponse.json({ name: 42 })));
      await expect(
        request('https://example.test/items', z.object({ name: z.string() })),
      ).rejects.toThrow();
      server.use(
        http.get('https://example.test/items', () => new HttpResponse(null, { status: 403 })),
      );
      await expect(request('https://example.test/items', z.unknown())).rejects.toMatchObject({
        status: 403,
      });
    } finally {
      server.close();
    }
  });
});

it('isolates Query caches and UI stores', () => {
  const first = createQueryClient();
  const second = createQueryClient();
  first.setQueryData(['private'], 'secret');
  expect(second.getQueryData(['private'])).toBeUndefined();
  const a = createUiStore();
  const b = createUiStore();
  a.getState().openModal();
  expect(a.getState().modalOpen).toBe(true);
  expect(b.getState().modalOpen).toBe(false);
  a.getState().reset();
  expect(a.getState().modalOpen).toBe(false);
});

it('validates public environment and blocks production mocking', () => {
  expect(parseClientEnv({ NEXT_PUBLIC_APP_ENV: 'local' }).appEnv).toBe('local');
  expect(() => parseClientEnv({ NEXT_PUBLIC_APP_ENV: 'wrong' })).toThrow();
  expect(isMockEnabled('production', 'true')).toBe(false);
  expect(isMockEnabled('development', 'true')).toBe(true);
  expect(isMockEnabled('development', 'false')).toBe(false);
});

it('reuses the QueryClient in the browser', () => {
  expect(getQueryClient()).toBe(getQueryClient());
});
