import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppBar } from '@/shared/ui/app-bar';

describe('AppBar', () => {
  it('renders brand, title or icons with independently optional actions', () => {
    const action = { label: '뒤로 가기', icon: <span>←</span>, onClick: vi.fn() };
    const { rerender } = render(<AppBar>Smalltalk Today</AppBar>);
    expect(screen.getByText('Smalltalk Today')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    rerender(
      <AppBar rightAction={action}>
        <h1>저장됨</h1>
      </AppBar>,
    );
    expect(screen.getByRole('heading', { name: '저장됨' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '뒤로 가기' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);

    rerender(<AppBar leftAction={action} />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('supports named left and right actions by keyboard', async () => {
    const user = userEvent.setup();
    const left = vi.fn();
    const right = vi.fn();
    render(
      <AppBar
        leftAction={{ label: '뒤로 가기', icon: <span>←</span>, onClick: left }}
        rightAction={{ label: '닫기', icon: <span>×</span>, onClick: right }}
      />,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: '뒤로 가기' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(left).toHaveBeenCalledOnce();
    await user.tab();
    expect(screen.getByRole('button', { name: '닫기' })).toHaveFocus();
    await user.keyboard(' ');
    expect(right).toHaveBeenCalledOnce();
  });
});
