'use client';

import { useId, type ComponentProps } from 'react';
import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Button } from '@/shared/ui';
import type { ProfileInput } from './profile-schema';
import { RegisteredInput } from './registered-input';

// ProfileForm → ProfileSection → AddressFields: 깊이가 달라도 같은 FormProvider를 읽습니다.
function AddressFields() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ProfileInput>();
  return (
    <RegisteredInput
      label="도시"
      // 이 경로에 입력하면 부모 폼의 profile.address.city가 변경됩니다.
      registration={register('profile.address.city')}
      error={errors.profile?.address?.city?.message}
    />
  );
}

// useFormContext는 부모의 register/errors를 가져옵니다. 독립적인 폼 상태를 만들지 않습니다.
export function ProfileSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ProfileInput>();
  return (
    <fieldset>
      <legend>기본 정보</legend>
      <RegisteredInput
        label="이름"
        registration={register('profile.name')}
        error={errors.profile?.name?.message}
      />
      {/* methods를 props로 계속 전달하지 않아도 더 깊은 자식이 동일한 폼에 접근합니다. */}
      <AddressFields />
    </fieldset>
  );
}

// value/onChange 대신 checked/onCheckedChange를 받는 커스텀 UI 연결 예제.
function PreferenceSwitch({
  checked,
  onCheckedChange,
  ...props
}: Omit<ComponentProps<'button'>, 'onChange'> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <Button
      {...props}
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
    >
      소식 받기
    </Button>
  );
}

// 부모의 control을 Controller에 연결해 커스텀 switch 값도 같은 제출 객체에 포함합니다.
// field.value → checked, onCheckedChange → field.onChange → 부모의 newsletter 값 변경.
// ref/onBlur도 전달하며 Controller 필드에 register를 중복 적용하지 않습니다.
export function PreferenceSection() {
  const { control } = useFormContext<ProfileInput>();
  const errorId = useId();
  return (
    <Controller
      name="newsletter"
      control={control}
      render={({ field, fieldState }) => (
        <div>
          <PreferenceSwitch
            ref={field.ref}
            name={field.name}
            checked={field.value}
            onCheckedChange={field.onChange}
            onBlur={field.onBlur}
            aria-describedby={fieldState.error ? errorId : undefined}
          />
          {fieldState.error && (
            <p id={errorId} role="alert">
              {fieldState.error.message}
            </p>
          )}
        </div>
      )}
    />
  );
}

export function ContactSection() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ProfileInput>();
  // contacts 배열도 부모 폼에 속합니다. append/remove 결과가 최종 제출에 함께 반영됩니다.
  const { fields, append, remove } = useFieldArray({ control, name: 'contacts' });
  return (
    <fieldset>
      <legend>연락처</legend>
      {fields.map((field, index) => (
        // index 대신 field.id를 key로 사용해야 중간 삭제 후 다른 입력과 뒤섞이지 않습니다.
        <div key={field.id}>
          <RegisteredInput
            label={`이메일 ${index + 1}`}
            type="email"
            registration={register(`contacts.${index}.email`)}
            error={errors.contacts?.[index]?.email?.message}
          />
          <Button onClick={() => remove(index)} aria-label={`연락처 ${index + 1} 삭제`}>
            삭제
          </Button>
        </div>
      ))}
      <Button onClick={() => append({ email: '' })} disabled={fields.length >= 5}>
        연락처 추가
      </Button>
    </fieldset>
  );
}

// 다른 자식이 바꾼 이름을 읽는 예제: 같은 control의 특정 필드만 구독합니다.
// ProfileSection의 이름 입력 → 부모 폼 갱신 → 이 미리보기 갱신.
export function ProfilePreview() {
  const { control } = useFormContext<ProfileInput>();
  const name = useWatch({ control, name: 'profile.name' });
  return <p aria-live="polite">미리보기: {name.trim() || '이름 없음'}</p>;
}
