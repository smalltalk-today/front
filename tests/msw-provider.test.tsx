import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MswProvider } from '@/_app/mocks/index.client';

const { start } = vi.hoisted(() => ({ start: vi.fn() }));
vi.mock('../src/_app/mocks/browser', () => ({ startMockWorker: start }));
vi.mock('../src/shared/config', async (original) => ({
  ...(await original<typeof import('../src/shared/config')>()),
  clientEnv: { appEnv: 'develop' },
}));
beforeEach(() => start.mockReset());
afterEach(() => vi.unstubAllEnvs());

it('blocks child requests until the worker starts and supports retry after failure', async () => {
  vi.stubEnv('NODE_ENV', 'development');
  start.mockRejectedValueOnce(new Error('worker failed')).mockResolvedValueOnce(undefined);
  const user = userEvent.setup();
  render(
    <MswProvider>
      <p>페이지 준비 완료</p>
    </MswProvider>,
  );
  expect(screen.queryByText('페이지 준비 완료')).not.toBeInTheDocument();
  await screen.findByRole('alert');
  await user.click(screen.getByRole('button', { name: '다시 시도' }));
  expect(await screen.findByText('페이지 준비 완료')).toBeInTheDocument();
  expect(start).toHaveBeenCalledTimes(2);
});

it('renders production children without starting the worker even with develop app env', async () => {
  vi.stubEnv('NODE_ENV', 'production');
  render(
    <MswProvider>
      <p>실제 페이지</p>
    </MswProvider>,
  );
  expect(screen.getByText('실제 페이지')).toBeInTheDocument();
  await waitFor(() => expect(start).not.toHaveBeenCalled());
});
