'use client';

import { createContext, useState, type ReactNode } from 'react';
import { createToastStore } from './store';

type ToastStoreApi = ReturnType<typeof createToastStore>;

export const ToastContext = createContext<ToastStoreApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createToastStore());

  return <ToastContext.Provider value={store}>{children}</ToastContext.Provider>;
}
