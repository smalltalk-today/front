'use client';

import { useEffect, useId, useRef } from 'react';
import { Button } from '../button/button';
import { getDialogFocusableElements, isDialogBackdropClick, trapDialogTab } from '../dialog-focus';
import styles from './bottom-sheet.module.css';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  buttonTxt?: string;
  buttonOnClick?: () => void;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  buttonTxt,
  buttonOnClick,
}: BottomSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!isOpen || !dialog) return;
    const previous = document.activeElement;
    dialog.showModal();
    (getDialogFocusableElements(dialog)[0] ?? dialog).focus();
    return () => {
      if (dialog.open) dialog.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : '바텀시트'}
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
      <div
        className={`${styles.handle} mt-3 h-1 shrink-0 self-center rounded-pill bg-neutral-200`}
        aria-hidden="true"
      />
      <div className="flex shrink-0 items-center justify-between py-4 pr-3 pl-4">
        {title && (
          <h2 id={titleId} className="text-headline-18-sb text-content-strong">
            {title}
          </h2>
        )}
        <button
          type="button"
          className={`${styles.close} cursor-pointer`}
          onClick={onClose}
          aria-label="바텀시트 닫기"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- 원본 24px SVG의 고유 크기를 유지한다. */}
          <img src="/design/close-m.svg" alt="" aria-hidden="true" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 text-body-16-r text-content-normal">
        {children}
      </div>
      {buttonTxt && (
        <div className={`${styles.footer} shrink-0 px-4`}>
          <Button variant="primary" size="M" onClick={buttonOnClick}>
            {buttonTxt}
          </Button>
        </div>
      )}
    </dialog>
  );
}
