'use client';
import { useId } from 'react';
import type { DemoItem } from '@/entities/demo-item';
import { Button, Input } from '@/shared/ui';
import { useRenameForm } from '../model/use-rename-form';

export function RenameItemForm({ item, onSuccess }: { item: DemoItem; onSuccess: () => void }) {
  const id = useId();
  const { form, mutation, submit } = useRenameForm(item.id, item.name, onSuccess);
  const error = form.formState.errors.name?.message;
  return (
    <form onSubmit={submit} className="space-y-4">
      <label htmlFor={id} className="block font-semibold">
        새 이름
      </label>
      <Input
        id={id}
        {...form.register('name')}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p role="alert" id={`${id}-error`} className="text-danger">
          {error}
        </p>
      )}
      {mutation.error && (
        <p role="alert" className="text-danger">
          {mutation.error.message}
        </p>
      )}
      <Button type="submit" disabled={form.formState.isSubmitting || mutation.isPending}>
        {mutation.isPending ? '저장 중…' : '저장'}
      </Button>
    </form>
  );
}
