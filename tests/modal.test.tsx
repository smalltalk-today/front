import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { Modal } from '@/shared/ui/index.client';

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>열기</button>
      <Modal open={open} title="입력" onClose={() => setOpen(false)}>
        <textarea aria-label="내용" />
        <select aria-label="선택">
          <option>옵션</option>
        </select>
        <a href="https://example.test/help">도움말</a>
      </Modal>
    </>
  );
}

it('focuses textarea and cycles all native controls and links', async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await user.click(screen.getByRole('button', { name: '열기' }));
  expect(screen.getByRole('textbox', { name: '내용' })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole('combobox')).toHaveFocus();
  await user.tab();
  expect(screen.getByRole('link')).toHaveFocus();
  await user.tab();
  expect(screen.getByRole('button', { name: '닫기' })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole('textbox')).toHaveFocus();
  await user.tab({ shift: true });
  expect(screen.getByRole('button', { name: '닫기' })).toHaveFocus();
  await user.keyboard('{Escape}');
  expect(screen.getByRole('button', { name: '열기' })).toHaveFocus();
});

it('uses its existing controlled callback for native cancellation and the close button', async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  render(
    <Modal open title="확인" onClose={onClose}>
      설명
    </Modal>,
  );
  const cancel = new Event('cancel', { bubbles: false, cancelable: true });
  fireEvent(screen.getByRole('dialog', { name: '확인' }), cancel);
  expect(cancel.defaultPrevented).toBe(true);
  expect(onClose).toHaveBeenCalledOnce();
  await user.click(screen.getByRole('button', { name: '닫기' }));
  expect(onClose).toHaveBeenCalledTimes(2);
});

it('does not interpret content or internal padding as a backdrop click', () => {
  const onClose = vi.fn();
  render(
    <Modal open title="확인" onClose={onClose}>
      설명
    </Modal>,
  );
  const dialog = screen.getByRole('dialog', { name: '확인' });
  vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue({
    x: 16,
    y: 316,
    top: 316,
    right: 359,
    bottom: 495,
    left: 16,
    width: 343,
    height: 179,
    toJSON: () => ({}),
  });
  fireEvent.click(dialog, { clientX: 20, clientY: 320 });
  fireEvent.click(screen.getByText('설명'), { clientX: 36, clientY: 350 });
  expect(onClose).not.toHaveBeenCalled();
  fireEvent.click(dialog, { clientX: 1, clientY: 1 });
  expect(onClose).toHaveBeenCalledOnce();
});
