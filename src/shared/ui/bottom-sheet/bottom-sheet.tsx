'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '../button/button';
import { getDialogFocusableElements, isDialogBackdropClick, trapDialogTab } from '../dialog-focus';
import styles from './bottom-sheet.module.css';

let openSheets = 0;
let previousOverflow = '';
let previousOverflowPriority = '';

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
  const closeRef = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ y: number; height: number; pointerId: number } | null>(null);
  const [size, setSize] = useState({ min: 0, max: 0, height: 0 });
  const titleId = useId();

  const setSheetHeight = (height: number) => {
    const dialog = ref.current;
    if (!dialog) return;
    const max = Math.round(window.innerHeight * 0.8);
    const min = Math.min(380, max);
    const next = Math.min(max, Math.max(min, Math.round(height)));
    dialog.style.height = `${next}px`;
    setSize({ min, max, height: next });
  };

  useEffect(() => {
    const dialog = ref.current;
    if (!isOpen || !dialog) return;
    const previous = document.activeElement;
    dialog.showModal();
    setSheetHeight(dialog.getBoundingClientRect().height);
    const onResize = () => setSheetHeight(dialog.getBoundingClientRect().height);
    window.addEventListener('resize', onResize);
    const rootStyle = document.documentElement.style;
    if (openSheets++ === 0) {
      previousOverflow = rootStyle.getPropertyValue('overflow');
      previousOverflowPriority = rootStyle.getPropertyPriority('overflow');
      rootStyle.setProperty('overflow', 'hidden');
    }
    (closeRef.current ?? getDialogFocusableElements(dialog)[0] ?? dialog).focus();
    return () => {
      window.removeEventListener('resize', onResize);
      drag.current = null;
      if (dialog.open) dialog.close();
      if (--openSheets === 0) {
        rootStyle.setProperty('overflow', previousOverflow, previousOverflowPriority);
      }
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
        className={`${styles.grip} flex shrink-0 justify-center py-3`}
        role="slider"
        tabIndex={0}
        aria-label="바텀시트 높이 조절"
        aria-orientation="vertical"
        aria-valuemin={size.min}
        aria-valuemax={size.max}
        aria-valuenow={size.height}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          drag.current = { y: event.clientY, height: size.height, pointerId: event.pointerId };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (drag.current?.pointerId === event.pointerId)
            setSheetHeight(drag.current.height + drag.current.y - event.clientY);
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowUp' || event.key === 'ArrowRight')
            setSheetHeight(size.height + 48);
          else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft')
            setSheetHeight(size.height - 48);
          else if (event.key === 'Home') setSheetHeight(size.min);
          else if (event.key === 'End') setSheetHeight(size.max);
          else return;
          event.preventDefault();
        }}
      >
        <div className={`${styles.handle} h-1 rounded-pill bg-neutral-200`} aria-hidden="true" />
      </div>
      <div className="flex shrink-0 items-center justify-between pt-1 pr-3 pb-4 pl-4">
        {title && (
          <h2 id={titleId} className="text-headline-18-sb text-content-strong">
            {title}
          </h2>
        )}
        <button
          ref={closeRef}
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
