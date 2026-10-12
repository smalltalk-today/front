import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { delay, http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Demo } from '@/widgets/demo';
import { createQueryClient } from '@/shared/lib/query';
import { UiStoreProvider } from '@/shared/lib/ui-store/index.client';
import { createDemoHandlers } from '@/_app/mocks/handlers';

const server = setupServer(...createDemoHandlers());
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers(...createDemoHandlers());
});
afterAll(() => server.close());
function mount() {
  const client = createQueryClient();
  client.setDefaultOptions({ queries: { retry: false, staleTime: 60_000 } });
  render(
    <QueryClientProvider client={client}>
      <UiStoreProvider>
        <Demo />
      </UiStoreProvider>
    </QueryClientProvider>,
  );
  return client;
}

describe('demo workflow', () => {
  it('shows loading then items, validates the form, and refreshes after mutation', async () => {
    const user = userEvent.setup();
    mount();
    expect(screen.getByRole('status')).toHaveTextContent('불러오는 중');
    await screen.findByText('첫 번째 항목');
    const trigger = screen.getByRole('button', { name: '이름 수정' });
    await user.click(trigger);
    const input = screen.getByRole('textbox', { name: '새 이름' });
    await user.clear(input);
    await user.click(screen.getByRole('button', { name: '저장' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('이름은 1~40자');
    await user.type(input, '새 항목');
    await user.click(screen.getByRole('button', { name: '저장' }));
    expect(await screen.findByText('새 항목')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
  it('renders empty and query error states', async () => {
    server.use(http.get('*/api/demo/items', () => HttpResponse.json([])));
    const client = mount();
    await screen.findByText('항목이 없습니다.');
    server.use(http.get('*/api/demo/items', () => new HttpResponse(null, { status: 500 })));
    await client.invalidateQueries({ queryKey: ['demo-items'] });
    expect(await screen.findByRole('alert')).toHaveTextContent('요청 실패 (500)');
  });
  it('keeps the form open on failure and disables duplicate submissions', async () => {
    const user = userEvent.setup();
    let submitted = 0;
    server.use(
      http.patch('*/api/demo/items/:id', async () => {
        submitted++;
        await delay(80);
        return new HttpResponse(null, { status: 500 });
      }),
    );
    mount();
    await screen.findByText('첫 번째 항목');
    await user.click(screen.getByRole('button', { name: '이름 수정' }));
    await user.dblClick(screen.getByRole('button', { name: '저장' }));
    expect(screen.getByRole('button', { name: '저장 중…' })).toBeDisabled();
    await screen.findByText('요청 실패 (500)');
    expect(submitted).toBe(1);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
  it('closes with Escape and restores focus', async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByText('첫 번째 항목');
    const trigger = screen.getByRole('button', { name: '이름 수정' });
    await user.click(trigger);
    expect(screen.getByRole('textbox', { name: '새 이름' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
