'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from './button';

function getFocusableElements(dialog: HTMLDialogElement) {
  return Array.from(
    dialog.querySelectorAll<HTMLElement>(
      'a[href], area[href], button, input, select, textarea, iframe, object, embed, [contenteditable], [tabindex]',
    ),
  ).filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.matches(':disabled, input[type="hidden"]') &&
      !element.closest('[hidden], [inert]') &&
      getComputedStyle(element).display !== 'none' &&
      getComputedStyle(element).visibility !== 'hidden',
  );
}

export interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previous = document.activeElement;
    dialog.showModal();
    getFocusableElements(dialog)[0]?.focus();
    return () => {
      dialog.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
        }
        if (event.key !== 'Tab') return;
        const elements = getFocusableElements(event.currentTarget);
        const first = elements[0];
        const last = elements.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      <div className="space-y-6">
        <h2 id={titleId} className="text-heading font-extrabold">
          {title}
        </h2>
        {open && children}
        <Button onClick={onClose}>닫기</Button>
      </div>
    </dialog>
  );
}
