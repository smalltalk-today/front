'use client';

import type { Toast as ToastData } from '@/shared/lib/toast';
import { useEffect, useState } from 'react';
import { Button } from '../button';

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const labels = {
  success: '완료',
  error: '오류',
  info: '안내',
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

  return (
    <div
      className="pointer-events-auto flex w-full items-center gap-3 rounded-control border border-border-medium bg-surface-default p-3 text-body2 text-content-normal shadow-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocused(false);
        }
      }}
    >
      <p className="min-w-0 flex-1 wrap-anywhere">
        <span className={variant === 'error' ? 'text-status-error' : 'font-semibold'}>
          {labels[variant]}
        </span>
        {' · '}
        {message}
      </p>

      <Button
        className="min-h-11 min-w-11 shrink-0 rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
        onClick={() => onDismiss(id)}
      >
        닫기
      </Button>
    </div>
  );
}
