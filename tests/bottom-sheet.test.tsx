import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { BottomSheet } from '@/shared/ui';

function Harness({ onAction = () => undefined }: { onAction?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)}>열기</button>
      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="안내"
        buttonTxt="버튼"
        buttonOnClick={onAction}
      >
        <button>내용 동작</button>
      </BottomSheet>
    </>
  );
}

it('opens a native modal with its title and returns focus after the close action', async () => {
  const user = userEvent.setup();
  const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
  render(<Harness />);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  const trigger = screen.getByRole('button', { name: '열기' });
  await user.click(trigger);
  expect(showModal).toHaveBeenCalledOnce();
  expect(screen.getByRole('dialog', { name: '안내' })).toHaveAttribute('open');
  const close = screen.getByRole('button', { name: '바텀시트 닫기' });
  expect(close).toHaveFocus();
  await user.click(close);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

it('cycles keyboard focus within the sheet and closes with Escape', async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await user.click(screen.getByRole('button', { name: '열기' }));
  const close = screen.getByRole('button', { name: '바텀시트 닫기' });
  await user.tab({ shift: true });
  expect(screen.getByRole('slider', { name: '바텀시트 높이 조절' })).toHaveFocus();
  await user.tab({ shift: true });
  expect(screen.getByRole('button', { name: '버튼' })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole('slider', { name: '바텀시트 높이 조절' })).toHaveFocus();
  await user.tab();
  expect(close).toHaveFocus();
  await user.tab();
  expect(screen.getByRole('button', { name: '내용 동작' })).toHaveFocus();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: '열기' })).toHaveFocus();
});

it('resizes with the keyboard and clamps to the viewport', async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await user.click(screen.getByRole('button', { name: '열기' }));
  const slider = screen.getByRole('slider', { name: '바텀시트 높이 조절' });
  const dialog = screen.getByRole('dialog', { name: '안내' });
  slider.focus();
  await user.keyboard('{End}');
  expect(dialog.style.height).toBe(`${Math.round(window.innerHeight * 0.8)}px`);
  await user.keyboard('{Home}');
  expect(dialog.style.height).toBe(`${slider.getAttribute('aria-valuemin')}px`);
  await user.keyboard('{ArrowUp}');
  expect(Number(slider.getAttribute('aria-valuenow'))).toBe(
    Number(slider.getAttribute('aria-valuemin')) + 48,
  );
});

it('keeps the minimum within the 80% limit on short screens', () => {
  vi.stubGlobal('innerHeight', 400);
  try {
    render(
      <BottomSheet isOpen onClose={() => undefined}>
        내용
      </BottomSheet>,
    );
    const slider = screen.getByRole('slider', { name: '바텀시트 높이 조절' });
    expect(slider).toHaveAttribute('aria-valuemin', '320');
    expect(slider).toHaveAttribute('aria-valuemax', '320');
  } finally {
    vi.unstubAllGlobals();
  }
});

it('preserves the optional CTA callback without implicitly closing the sheet', async () => {
  const user = userEvent.setup();
  const onAction = vi.fn();
  render(<Harness onAction={onAction} />);
  await user.click(screen.getByRole('button', { name: '열기' }));
  await user.click(screen.getByRole('button', { name: '버튼' }));
  expect(onAction).toHaveBeenCalledOnce();
  expect(screen.getByRole('dialog', { name: '안내' })).toBeInTheDocument();
});

it('handles native cancellation through the controlled close callback', () => {
  const onClose = vi.fn();
  render(
    <BottomSheet isOpen onClose={onClose} title="안내">
      설명
    </BottomSheet>,
  );
  const cancel = new Event('cancel', { bubbles: false, cancelable: true });
  fireEvent(screen.getByRole('dialog', { name: '안내' }), cancel);
  expect(cancel.defaultPrevented).toBe(true);
  expect(onClose).toHaveBeenCalledOnce();
});

it('closes only for clicks outside the sheet bounds, preserving content and padding clicks', () => {
  const onClose = vi.fn();
  render(
    <BottomSheet isOpen onClose={onClose} title="안내">
      설명
    </BottomSheet>,
  );
  const dialog = screen.getByRole('dialog', { name: '안내' });
  vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 432,
    top: 432,
    right: 375,
    bottom: 812,
    left: 0,
    width: 375,
    height: 380,
    toJSON: () => ({}),
  });
  fireEvent.click(dialog, { clientX: 10, clientY: 440 });
  fireEvent.click(screen.getByText('설명'), { clientX: 16, clientY: 500 });
  expect(onClose).not.toHaveBeenCalled();
  fireEvent.click(dialog, { clientX: 100, clientY: 400 });
  expect(onClose).toHaveBeenCalledOnce();
});

it('supports an unnamed sheet and omits the optional CTA', () => {
  render(
    <BottomSheet isOpen onClose={() => undefined}>
      설명
    </BottomSheet>,
  );
  expect(screen.getByRole('dialog', { name: '바텀시트' })).not.toHaveAttribute('aria-labelledby');
  expect(screen.getAllByRole('button')).toHaveLength(1);
});

it('locks background scrolling until the last sheet closes and restores the previous style', () => {
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty('overflow', 'scroll', 'important');
  const onClose = vi.fn();
  const sheet = (open: boolean) => (
    <BottomSheet isOpen={open} onClose={onClose}>
      설명
    </BottomSheet>
  );
  const { rerender, unmount } = render(
    <>
      {sheet(true)}
      {sheet(true)}
    </>,
  );
  expect(rootStyle.overflow).toBe('hidden');
  rerender(
    <>
      {sheet(false)}
      {sheet(true)}
    </>,
  );
  expect(rootStyle.overflow).toBe('hidden');
  unmount();
  expect(rootStyle.overflow).toBe('scroll');
  expect(rootStyle.getPropertyPriority('overflow')).toBe('important');
  rootStyle.removeProperty('overflow');
});
