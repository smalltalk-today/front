'use client';

import type { Toast as ToastData } from '@/shared/lib/toast';
import { Check, Xmark } from 'iconoir-react';
import { useEffect, useState } from 'react';

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const iconStyle = 'size-6 rounded-full p-1 text-white';
const labels = {
  success: <Check className={`${iconStyle} bg-green-600`} />,
  error: <Xmark className={`${iconStyle} bg-red-600`} />,
  info: null,
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
      className="flex min-h-14 w-full items-center justify-between gap-x-2 rounded-control bg-neutral-600 px-3 py-4"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocused(false);
        }
      }}
    >
      <div className="flex items-center gap-x-2">
        <span className="">{labels[variant]}</span>
        <p className="text-body-14-m text-white">{message}</p>
      </div>

      <button onClick={() => onDismiss(id)}>
        <Xmark className="size-6" />
      </button>
    </div>
  );
}
