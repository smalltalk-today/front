'use client';

import type { Toast as ToastData } from '@/shared/lib/toast';
import { Check, Xmark } from 'iconoir-react';
import { useEffect, useState, type FocusEvent } from 'react';

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const styles = {
  root: 'pointer-events-auto flex min-h-14 w-full items-center justify-between gap-x-2 rounded-control bg-neutral-600 px-3 py-4',
  statusIcon: 'size-6 shrink-0 rounded-full p-1 text-white',
};

const statusIcons = {
  success: <Check className={`${styles.statusIcon} bg-green-600`} aria-hidden="true" />,
  error: <Xmark className={`${styles.statusIcon} bg-red-600`} aria-hidden="true" />,
  info: null,
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const { id, message, variant, duration } = toast;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const statusIcon = statusIcons[variant];

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
      {statusIcon}
      <p className="min-w-0 flex-1 text-body-14-m wrap-anywhere text-white">{message}</p>

      <button
        aria-label="토스트 닫기"
        className="flex-center shrink-0 rounded-control text-white"
        onClick={() => onDismiss(id)}
      >
        <Xmark className="size-6" aria-hidden="true" />
      </button>
    </div>
  );
}
