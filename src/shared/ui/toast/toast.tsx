'use client';

/* eslint-disable @next/next/no-img-element -- 원본 SVG의 고유 크기와 경로를 그대로 사용한다. */

import type { Toast as ToastData } from '@/shared/lib/toast';
import { useEffect, useState, type FocusEvent } from 'react';

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const styles = {
  root: 'pointer-events-auto flex w-full items-center justify-between gap-2 rounded-control bg-surface-popup px-3 py-4',
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const { id, message, variant, duration } = toast;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (duration <= 0 || hovered || focused) return;
    const timer = window.setTimeout(() => onDismiss(id), duration);
    return () => window.clearTimeout(timer);
  }, [id, duration, onDismiss, hovered, focused]);

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setFocused(false);
    }
  }

  return (
    <div
      className={styles.root}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={handleBlur}
    >
      {variant === 'success' ? (
        <img src="/design/toast-success.svg" className="shrink-0" alt="" aria-hidden="true" />
      ) : variant === 'error' ? (
        <img src="/design/toast-error.svg" className="shrink-0" alt="" aria-hidden="true" />
      ) : null}
      <p className="min-w-0 flex-1 text-body-14-m wrap-anywhere text-white">{message}</p>

      <button
        type="button"
        aria-label="토스트 닫기"
        className="flex shrink-0 items-center justify-center"
        onClick={() => onDismiss(id)}
      >
        <img src="/design/close-s.svg" alt="" aria-hidden="true" />
      </button>
    </div>
  );
}
