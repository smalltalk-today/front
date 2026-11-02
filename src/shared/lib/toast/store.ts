import { create } from 'zustand';
import type { Toast, ToastOptions } from './type';

export interface ToastStore {
  currentToast: Toast | null;
  show: (options: ToastOptions & { message: string; variant?: Toast['variant'] }) => string;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  currentToast: null,

  show: ({ message, variant = 'info', duration = 4000 }) => {
    const id = crypto.randomUUID();

    set({
      currentToast: {
        id,
        message,
        variant,
        duration,
      },
    });

    return id;
  },

  dismiss: (id) => {
    set((state) => (state.currentToast?.id === id ? { currentToast: null } : state));
  },
}));
