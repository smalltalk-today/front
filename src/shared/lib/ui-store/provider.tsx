'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { useStore } from 'zustand';
import { createUiStore, type UiState } from './index';

const UiStoreContext = createContext<ReturnType<typeof createUiStore> | null>(null);

export function UiStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createUiStore);
  return <UiStoreContext.Provider value={store}>{children}</UiStoreContext.Provider>;
}

export function useUiStore<T>(selector: (state: UiState) => T): T {
  const store = useContext(UiStoreContext);
  if (!store) throw new Error('UiStoreProvider가 필요합니다.');
  return useStore(store, selector);
}
