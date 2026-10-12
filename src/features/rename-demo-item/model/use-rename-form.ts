'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { renameItemSchema, type RenameItemInput } from './schema';
import { useRenameItem } from './use-rename-item';

export function useRenameForm(id: string, name: string, onSuccess: () => void) {
  const form = useForm<RenameItemInput>({
    resolver: zodResolver(renameItemSchema),
    defaultValues: { name },
  });
  const mutation = useRenameItem(id, onSuccess);
  const submit = form.handleSubmit(async (input) => {
    try {
      await mutation.mutateAsync(input);
    } catch {
      /* mutation.error를 UI에서 표시한다. */
    }
  });
  return { form, mutation, submit };
}
