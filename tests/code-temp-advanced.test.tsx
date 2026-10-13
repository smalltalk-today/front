import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { ProfileForm } from '../code temp/react-hook-form-zod/profile-form';
import { parseRouteSearch, updateQueryString } from '../code temp/routing/app/examples/_lib/search';

it('submits nested fields, controlled preferences and dynamic contacts together', async () => {
  const user = userEvent.setup();
  const save = vi.fn().mockResolvedValue(undefined);
  render(<ProfileForm onSubmit={save} />);
  await user.type(screen.getByRole('textbox', { name: '이름' }), '  이름  ');
  await user.type(screen.getByRole('textbox', { name: '도시' }), '서울');
  await user.click(screen.getByRole('switch', { name: '소식 받기' }));
  await user.click(screen.getByRole('button', { name: '연락처 추가' }));
  await user.type(screen.getByRole('textbox', { name: '이메일 1' }), 'user@example.com');
  await user.click(screen.getByRole('button', { name: '프로필 저장' }));
  await screen.findByText('프로필을 저장했습니다.');
  expect(save).toHaveBeenCalledWith({
    profile: { name: '이름', address: { city: '서울' } },
    newsletter: true,
    contacts: [{ email: 'user@example.com' }],
  });
});

it('normalizes untrusted URL values and preserves unrelated repeated query keys', () => {
  expect(parseRouteSearch({ page: ['-1', '2'], tab: 'unknown', q: '  검색  ' })).toEqual({
    page: 1,
    tab: 'overview',
    q: '검색',
  });
  const next = new URLSearchParams(
    updateQueryString('tag=a&tag=b&page=3', {
      tab: 'details',
      page: null,
    }),
  );
  expect(next.getAll('tag')).toEqual(['a', 'b']);
  expect(next.get('tab')).toBe('details');
  expect(next.has('page')).toBe(false);
});
