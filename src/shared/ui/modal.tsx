'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from './button/button';
import { getDialogFocusableElements, isDialogBackdropClick, trapDialogTab } from './dialog-focus';
import styles from './modal.module.css';

export interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  confirm?: { label: string; onClick: () => void };
}

export function Modal({ open, title, onClose, children, confirm }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previous = document.activeElement;
    dialog.showModal();
    (getDialogFocusableElements(dialog)[0] ?? dialog).focus();
    return () => {
      if (dialog.open) dialog.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} p-5`}
      aria-labelledby={titleId}
      aria-describedby={confirm ? `${titleId}-description` : undefined}
      tabIndex={-1}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (isDialogBackdropClick(event)) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
        }
        trapDialogTab(event);
      }}
    >
      <div className="flex flex-col gap-6">
        <h2 id={titleId} className="text-title-18-sb text-content-strong">
          {title}
        </h2>
        <div id={`${titleId}-description`} className="text-body-16-r text-content-normal">
          {open && children}
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant={confirm ? 'secondary' : 'primary'}
            size="XS"
            className="w-auto"
            onClick={onClose}
          >
            {confirm ? '취소' : '닫기'}
          </Button>
          {confirm && (
            <Button variant="primary" size="XS" className="w-auto" onClick={confirm.onClick}>
              {confirm.label}
            </Button>
          )}
        </div>
      </div>
    </dialog>
  );
}
