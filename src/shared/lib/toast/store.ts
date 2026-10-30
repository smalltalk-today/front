import { createStore } from 'zustand';
import { Toast } from './type';

export interface ToastStore {
  currentToast: Toast | null;
  show: (options: { message: string; variant?: Toast['variant']; duration?: number }) => string;
  dismiss: (id: string) => void;
}

export const createToastStore = () =>
  createStore<ToastStore>((set) => ({
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
      set((state) => (state?.currentToast?.id === id ? { currentToast: null } : state));
    },
  }));
