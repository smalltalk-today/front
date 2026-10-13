'use client';

import { useId } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { Input } from '@/shared/ui';

// RHF 인스턴스와 도메인을 몰라도 다른 폼에서 같은 입력을 사용할 수 있습니다.
export function RegisteredInput({
  label,
  registration,
  error,
  type = 'text',
}: {
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
  type?: 'text' | 'email';
}) {
  // registration에는 name/ref/onChange/onBlur가 들어 있습니다. 실제 input까지 그대로 연결합니다.
  // 입력 변경 → 부모 register의 onChange → 부모 RHF 값 변경. 이 컴포넌트는 useForm이 필요 없습니다.
  const id = useId();
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <Input
        id={id}
        type={type}
        {...registration}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
