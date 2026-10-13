'use client';

import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@/shared/ui';
import { itemInputSchema, type ItemInput } from './schema';

// 독립 폼 기본 예제: 입력 등록 → Zod 검증 → onSubmit 저장 → 성공 시 초기화.
export function ItemForm({ onSubmit }: { onSubmit: (input: ItemInput) => Promise<void> }) {
  const id = useId();
  const { register, handleSubmit, reset, setError, clearErrors, formState } = useForm<ItemInput>({
    resolver: zodResolver(itemInputSchema),
    defaultValues: { name: '' },
  });
  const error = formState.errors.name?.message ?? formState.errors.root?.message;
  // handleSubmit은 검증에 성공한 값만 넘깁니다. 스키마의 trim 결과도 여기에 반영됩니다.
  const submit = handleSubmit(async (input) => {
    clearErrors('root');
    try {
      await onSubmit(input);
      reset();
    } catch (error) {
      setError('root', {
        message: error instanceof Error ? error.message : '저장에 실패했습니다.',
      });
    }
  });

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor={id}>이름</label>
      {/* register의 이벤트와 ref를 실제 입력에 연결합니다. 제출 중에는 추가 수정을 막습니다. */}
      <Input
        id={id}
        {...register('name')}
        aria-invalid={!!formState.errors.name}
        aria-describedby={error ? `${id}-error` : undefined}
        disabled={formState.isSubmitting}
      />
      {error && (
        <p id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? '저장 중…' : '저장'}
      </Button>
    </form>
  );
}
