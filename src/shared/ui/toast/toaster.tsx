'use client';

import { useToastStore, type ToastPosition } from '@/shared/lib/toast';
import { Toast } from './toast';

const positions: Record<ToastPosition, string> = {
  'top-left': 'top-6 justify-start',
  'top-center': 'top-6 justify-center',
  'top-right': 'top-6 justify-end',
  'center-left': 'top-1/2 -translate-y-1/2 justify-start',
  'center-center': 'top-1/2 -translate-y-1/2 justify-center',
  'center-right': 'top-1/2 -translate-y-1/2 justify-end',
  'bottom-left': 'bottom-6 justify-start',
  'bottom-center': 'bottom-6 justify-center',
  'bottom-right': 'bottom-6 justify-end',
};

export function Toaster() {
  const currentToast = useToastStore((state) => state.currentToast);
  const dismiss = useToastStore((state) => state.dismiss);
  const position = currentToast?.position ?? 'bottom-center';

  return (
    <div className={`pointer-events-none fixed inset-x-0 z-50 flex px-4 ${positions[position]}`}>
      <div className="w-full max-w-sm" role="status" aria-atomic="true">
        {currentToast && <Toast key={currentToast.id} toast={currentToast} onDismiss={dismiss} />}
      </div>
    </div>
  );
}
