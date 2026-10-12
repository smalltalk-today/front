import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
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
