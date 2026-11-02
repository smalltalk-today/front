'use client';

import { useToastStore } from '@/shared/lib/toast';
import { Toast } from './toast';

const positions = 'bottom-[94px] justify-center md:bottom-[45px]';

export function Toaster() {
  const currentToast = useToastStore((state) => state.currentToast);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div className={`pointer-events-none fixed inset-x-0 z-50 flex ${positions}`}>
      <div className="w-full max-w-sm" role="status" aria-atomic="true">
        {currentToast && <Toast key={currentToast.id} toast={currentToast} onDismiss={dismiss} />}
      </div>
    </div>
  );
}
