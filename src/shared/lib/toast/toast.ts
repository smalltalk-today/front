import { useToastStore, type ToastStore } from './store';
import type { ToastOptions } from './type';

type ToastInput = Parameters<ToastStore['show']>[0];

function publish(options: ToastInput): void {
  if (typeof window === 'undefined') {
    throw new Error('toast는 브라우저에서 호출해야 합니다.');
  }

  useToastStore.getState().show(options);
}

export const toast = Object.assign(
  (message: string, options: ToastOptions = {}) =>
    publish({ ...options, message, variant: 'info' }),
  {
    success: (message: string, options: ToastOptions = {}) =>
      publish({ ...options, message, variant: 'success' }),
    error: (message: string, options: ToastOptions = {}) =>
      publish({ ...options, message, variant: 'error' }),
  },
);
