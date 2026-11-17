import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { toast, useToastStore, type Toast as ToastData } from '@/shared/lib/toast';
import { Toast } from '@/shared/ui/toast/toast';
import { Toaster } from '@/shared/ui/toast/toaster';

function sample(overrides: Partial<ToastData> = {}): ToastData {
  return {
    id: 'toast-1',
    message: '알림',
    variant: 'success',
    duration: 4000,
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  useToastStore.setState({ currentToast: null });
});

afterEach(() => {
  cleanup();
  useToastStore.setState({ currentToast: null });
  vi.clearAllTimers();
  vi.useRealTimers();
});

it('keeps the single live region and closes the default notification after four seconds', () => {
  render(<Toaster />);
  expect(screen.getByRole('status')).toHaveAttribute('aria-atomic', 'true');
  expect(screen.queryByRole('button', { name: '토스트 닫기' })).not.toBeInTheDocument();

  act(() => toast('기본 알림'));
  expect(screen.getByText('기본 알림')).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(3999));
  expect(screen.getByText('기본 알림')).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(1));
  expect(screen.queryByText('기본 알림')).not.toBeInTheDocument();
});

it('uses the original assets and retains the icon-free info API', () => {
  const dismiss = vi.fn();
  const { container, rerender } = render(<Toast toast={sample()} onDismiss={dismiss} />);
  const images = () => Array.from(container.querySelectorAll('img')).map((image) => image.src);

  expect(images()).toEqual([
    expect.stringContaining('/design/toast-success.svg'),
    expect.stringContaining('/design/close-s.svg'),
  ]);
  rerender(<Toast toast={sample({ variant: 'error' })} onDismiss={dismiss} />);
  expect(images()).toEqual([
    expect.stringContaining('/design/toast-error.svg'),
    expect.stringContaining('/design/close-s.svg'),
  ]);
  rerender(<Toast toast={sample({ variant: 'info' })} onDismiss={dismiss} />);
  expect(images()).toEqual([expect.stringContaining('/design/close-s.svg')]);
  expect(container.querySelector('svg')).not.toBeInTheDocument();
  for (const image of container.querySelectorAll('img')) {
    expect(image).toHaveAttribute('alt', '');
    expect(image).toHaveAttribute('aria-hidden', 'true');
  }
});

it('keeps non-positive durations sticky and supports manual dismissal', () => {
  const dismiss = vi.fn();
  const { rerender } = render(<Toast toast={sample({ duration: 0 })} onDismiss={dismiss} />);
  act(() => vi.advanceTimersByTime(60_000));
  expect(dismiss).not.toHaveBeenCalled();
  rerender(<Toast toast={sample({ duration: -1 })} onDismiss={dismiss} />);
  act(() => vi.advanceTimersByTime(60_000));
  expect(dismiss).not.toHaveBeenCalled();
  const close = screen.getByRole('button', { name: '토스트 닫기' });
  expect(close).toHaveAttribute('type', 'button');
  fireEvent.click(close);
  expect(dismiss).toHaveBeenCalledExactlyOnceWith('toast-1');
});

it('restarts the full duration after hover ends', () => {
  const dismiss = vi.fn();
  render(<Toast toast={sample()} onDismiss={dismiss} />);
  const root = screen.getByText('알림').parentElement!;
  act(() => vi.advanceTimersByTime(3000));
  fireEvent.mouseEnter(root);
  act(() => vi.advanceTimersByTime(10_000));
  expect(dismiss).not.toHaveBeenCalled();
  fireEvent.mouseLeave(root);
  act(() => vi.advanceTimersByTime(3999));
  expect(dismiss).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(1));
  expect(dismiss).toHaveBeenCalledExactlyOnceWith('toast-1');
});

it('keeps the timer stopped when focus moves within a notification', () => {
  const dismiss = vi.fn();
  render(<Toast toast={sample()} onDismiss={dismiss} />);
  const root = screen.getByText('알림').parentElement!;
  const close = screen.getByRole('button', { name: '토스트 닫기' });
  fireEvent.focus(close);
  fireEvent.blur(root, { relatedTarget: close });
  act(() => vi.advanceTimersByTime(10_000));
  expect(dismiss).not.toHaveBeenCalled();
  fireEvent.blur(root, { relatedTarget: document.body });
  act(() => vi.advanceTimersByTime(3999));
  expect(dismiss).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(1));
  expect(dismiss).toHaveBeenCalledExactlyOnceWith('toast-1');
});

it('waits for both hover and focus to end before restarting', () => {
  const dismiss = vi.fn();
  render(<Toast toast={sample()} onDismiss={dismiss} />);
  const root = screen.getByText('알림').parentElement!;
  fireEvent.mouseEnter(root);
  fireEvent.focus(screen.getByRole('button', { name: '토스트 닫기' }));
  fireEvent.mouseLeave(root);
  act(() => vi.advanceTimersByTime(10_000));
  expect(dismiss).not.toHaveBeenCalled();
  fireEvent.blur(root, { relatedTarget: document.body });
  act(() => vi.advanceTimersByTime(4000));
  expect(dismiss).toHaveBeenCalledExactlyOnceWith('toast-1');
});

it('replaces a notification and protects its successor from a stale dismiss', () => {
  render(<Toaster />);
  let previousId = '';
  act(() => {
    previousId = useToastStore.getState().show({ message: '첫 알림', variant: 'success' });
  });
  act(() => vi.advanceTimersByTime(3000));
  fireEvent.mouseEnter(screen.getByText('첫 알림').parentElement!);
  act(() => toast.error('새 알림'));
  expect(screen.queryByText('첫 알림')).not.toBeInTheDocument();
  expect(screen.getByText('새 알림')).toBeInTheDocument();
  act(() => useToastStore.getState().dismiss(previousId));
  act(() => vi.advanceTimersByTime(3999));
  expect(screen.getByText('새 알림')).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(1));
  expect(screen.queryByText('새 알림')).not.toBeInTheDocument();
});

it('cancels its timer on unmount', () => {
  const dismiss = vi.fn();
  const { unmount } = render(<Toast toast={sample()} onDismiss={dismiss} />);
  unmount();
  act(() => vi.advanceTimersByTime(4000));
  expect(dismiss).not.toHaveBeenCalled();
});
