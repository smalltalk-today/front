import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { Home } from '@/widgets/home';

it('keeps the selected tab and its filtered content when the bottom sheet closes', async () => {
  const user = userEvent.setup();
  render(<Home />);

  await user.click(screen.getByRole('tab', { name: '테크' }));
  expect(screen.getByRole('tab', { name: '테크' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tabpanel')).toHaveTextContent('테크 콘텐츠 1');
  expect(screen.getByRole('tabpanel')).not.toHaveTextContent('경제 콘텐츠 1');

  const open = screen.getByRole('button', { name: '바텀시트 열기' });
  await user.click(open);
  expect(screen.getByRole('dialog', { name: '타이틀' })).toHaveTextContent('설명');
  await user.click(screen.getByRole('button', { name: '바텀시트 닫기' }));

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(open).toHaveFocus();
  expect(screen.getByRole('tab', { name: '테크' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tabpanel')).toHaveTextContent('테크 콘텐츠 1');
});
