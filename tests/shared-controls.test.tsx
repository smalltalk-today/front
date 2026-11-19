import { createRef, type FormEvent } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Badge } from '@/shared/ui/badge/badge';
import { Button } from '@/shared/ui/button/button';

describe('Button native contract', () => {
  it.each([
    ['primary', 'text-white'],
    ['secondary', 'text-neutral-900'],
  ] as const)(
    'keeps the %s source text color when semantic typography classes are merged',
    (variant, textColor) => {
      const { rerender } = render(
        <Button variant={variant} size="L">
          CTA
        </Button>,
      );
      for (const [size, typography] of [
        ['L', 'text-label-18-sb'],
        ['M', 'text-label-16-sb'],
        ['S', 'text-label-14-m'],
        ['XS', 'text-label-14-m'],
      ] as const) {
        rerender(
          <Button variant={variant} size={size}>
            CTA
          </Button>,
        );
        expect(screen.getByRole('button', { name: 'CTA' })).toHaveClass(textColor, typography);
      }
    },
  );

  it('does not submit by default and preserves an explicit submit action', async () => {
    const user = userEvent.setup();
    const submit = vi.fn((event: FormEvent) => event.preventDefault());
    render(
      <form onSubmit={submit}>
        <Button>일반 동작</Button>
        <Button type="submit">제출</Button>
      </form>,
    );

    await user.click(screen.getByRole('button', { name: '일반 동작' }));
    expect(submit).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '제출' }));
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('forwards ref, native attributes, events and an existing layout class', async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLButtonElement>();
    const click = vi.fn();
    const keyDown = vi.fn();
    render(
      <Button
        ref={ref}
        name="action"
        value="save"
        aria-label="저장"
        aria-describedby="save-help"
        data-purpose="save"
        className="mb-2 shrink-0"
        onClick={click}
        onKeyDown={keyDown}
      >
        저장
      </Button>,
    );

    const button = screen.getByRole('button', { name: '저장' });
    expect(ref.current).toBe(button);
    expect(button).toHaveAttribute('name', 'action');
    expect(button).toHaveAttribute('value', 'save');
    expect(button).toHaveAttribute('data-purpose', 'save');
    expect(button).toHaveAttribute('aria-describedby', 'save-help');
    expect(button).toHaveClass('mb-2', 'shrink-0');
    ref.current?.focus();
    expect(button).toHaveFocus();
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(keyDown).toHaveBeenCalledTimes(1);
    await user.click(button);
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('keeps a disabled control non-interactive and enables the same callback again', async () => {
    const user = userEvent.setup();
    const click = vi.fn();
    const { rerender } = render(
      <Button variant="secondary" disabled onClick={click}>
        실행
      </Button>,
    );

    await user.click(screen.getByRole('button', { name: '실행' }));
    expect(click).not.toHaveBeenCalled();
    rerender(
      <Button variant="secondary" onClick={click}>
        실행
      </Button>,
    );
    await user.click(screen.getByRole('button', { name: '실행' }));
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('preserves the primary XS disabled action and source typography', async () => {
    const user = userEvent.setup();
    const click = vi.fn();
    render(
      <Button variant="primary" size="XS" disabled onClick={click}>
        작은 실행
      </Button>,
    );

    const button = screen.getByRole('button', { name: '작은 실행' });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('h-10', 'text-label-14-m', 'disabled:text-neutral-400');
    await user.click(button);
    expect(click).not.toHaveBeenCalled();
  });

  it.each([
    ['link', 'text-neutral-900'],
    ['text', 'text-neutral-600'],
  ] as const)(
    'preserves %s typography, keyboard activation and disabled behavior',
    async (variant, textColor) => {
      const user = userEvent.setup();
      const click = vi.fn();
      const { rerender } = render(
        <Button variant={variant} onClick={click}>
          추가 동작
        </Button>,
      );

      const button = screen.getByRole('button', { name: '추가 동작' });
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveClass('text-label-14-r', textColor);
      button.focus();
      await user.keyboard('{Enter}');
      expect(click).toHaveBeenCalledTimes(1);

      rerender(
        <Button variant={variant} disabled onClick={click}>
          추가 동작
        </Button>,
      );
      expect(button).toBeDisabled();
      await user.click(button);
      expect(click).toHaveBeenCalledTimes(1);
    },
  );

  it('keeps the supplied icon child and accessible native action', async () => {
    const user = userEvent.setup();
    const click = vi.fn();
    const { rerender } = render(
      <Button variant="icon" size="icon" aria-label="닫기" onClick={click}>
        <svg data-testid="provided-close-icon" aria-hidden="true" />
      </Button>,
    );

    const button = screen.getByRole('button', { name: '닫기' });
    expect(button).toContainElement(screen.getByTestId('provided-close-icon'));
    expect(button).toHaveClass('size-icon-touchframe', 'text-neutral-800');
    button.focus();
    await user.keyboard(' ');
    expect(click).toHaveBeenCalledTimes(1);

    rerender(
      <Button variant="icon" aria-label="닫기" disabled onClick={click}>
        <svg data-testid="provided-close-icon" aria-hidden="true" />
      </Button>,
    );
    expect(button).toBeDisabled();
    expect(button).toContainElement(screen.getByTestId('provided-close-icon'));
    await user.click(button);
    expect(click).toHaveBeenCalledTimes(1);
  });
});

describe('Badge source contract', () => {
  it('keeps the supplied string in the default source badge', () => {
    render(<Badge>추천</Badge>);

    const badge = screen.getByText('추천');
    expect(badge.tagName).toBe('SPAN');
    expect(badge).toHaveTextContent(/^추천$/);
    expect(badge).toHaveClass(
      'text-caption-12-m',
      'bg-neutral-800',
      'text-white',
      'rounded-pill',
      'opacity-badge',
    );
  });
});

// Compile-time checks keep visual props separate from native behavior props.
void (<Button variant="primary" size="L" />);
void (<Button variant="icon" size="icon" aria-label="닫기" />);
// @ts-expect-error link buttons have no CTA size.
void (<Button variant="link" size="M" />);
// @ts-expect-error text buttons have no CTA size.
void (<Button variant="text" size="S" />);
// @ts-expect-error icon buttons only accept the icon size.
void (<Button variant="icon" size="XS" />);
// @ts-expect-error static inline styles bypass the source token contract.
void (<Button style={{ color: 'red' }} />);
// @ts-expect-error a native color attribute bypasses the visual variant contract.
void (<Button color="red" />);
// @ts-expect-error HTML injection bypasses the registered component contract.
void (<Button dangerouslySetInnerHTML={{ __html: '<span>임의 UI</span>' }} />);
// @ts-expect-error badges preserve their string-only children contract.
void (<Badge>{42}</Badge>);
