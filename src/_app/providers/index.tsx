'use client';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { getQueryClient } from '@/shared/lib/query';
import { Toaster } from '@/shared/ui/index.client';
import { MswProvider } from '../mocks/index.client';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MswProvider>
      <QueryClientProvider client={getQueryClient()}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </MswProvider>
  );
}
