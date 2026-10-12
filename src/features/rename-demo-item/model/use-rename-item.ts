'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { demoItemKeys } from '@/entities/demo-item';
import { renameItem } from '../api/rename-item';
import type { RenameItemInput } from './schema';

export function useRenameItem(id: string, onSuccess: () => void) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: RenameItemInput) => renameItem(id, input),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: demoItemKeys.all });
      onSuccess();
    },
  });
}
