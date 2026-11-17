'use client';

import { useToastStore } from '@/shared/lib/toast';
import { Toast } from './toast';

const positions = 'bottom-toast-bottom-mobile justify-center md:bottom-toast-bottom-desktop';

export function Toaster() {
  const currentToast = useToastStore((state) => state.currentToast);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div className={`pointer-events-none fixed inset-x-0 z-50 flex ${positions}`}>
      <div className="w-full max-w-toast" role="status" aria-atomic="true">
        {currentToast && <Toast key={currentToast.id} toast={currentToast} onDismiss={dismiss} />}
      </div>
    </div>
  );
}
