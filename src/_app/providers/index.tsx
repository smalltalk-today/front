'use client';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { getQueryClient } from '@/shared/lib/query';
import { UiStoreProvider } from '@/shared/lib/ui-store/index.client';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <UiStoreProvider>{children}</UiStoreProvider>
    </QueryClientProvider>
  );
}
