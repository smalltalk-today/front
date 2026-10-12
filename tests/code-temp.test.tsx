import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { ZustandExample } from '../code temp/zustand/example';
import { QueryExample } from '../code temp/tanstack-query/example';
import { ItemForm } from '../code temp/react-hook-form-zod/item-form';

it('shares counter state within a provider and isolates the other provider', async () => {
  const user = userEvent.setup();
  render(<ZustandExample />);
  const first = within(screen.getByRole('region', { name: '공유 영역 A' }));
  const second = within(screen.getByRole('region', { name: '독립 영역 B' }));
  await user.click(first.getByRole('button', { name: '증가' }));
  expect(first.getByText('현재 값: 1')).toBeInTheDocument();
  expect(first.getByText('요약: 공유 카운터 / 1')).toBeInTheDocument();
  expect(second.getByText('현재 값: 0')).toBeInTheDocument();
});

it('refreshes the query list after a validated form submission', async () => {
  const user = userEvent.setup();
  render(<QueryExample />);
  await screen.findByText('등록된 항목이 없습니다.');
  await user.type(screen.getByRole('textbox', { name: '이름' }), '  새 항목  ');
  await user.click(screen.getByRole('button', { name: '저장' }));
  expect(await screen.findByText('새 항목', { selector: 'li' })).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: '이름' })).toHaveValue('');
});

it('retains input and displays the save error', async () => {
  const user = userEvent.setup();
  const save = vi.fn().mockRejectedValue(new Error('저장 실패'));
  render(<ItemForm onSubmit={save} />);
  await user.type(screen.getByRole('textbox', { name: '이름' }), '유지할 입력');
  await user.click(screen.getByRole('button', { name: '저장' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('저장 실패');
  expect(screen.getByRole('textbox', { name: '이름' })).toHaveValue('유지할 입력');
});
