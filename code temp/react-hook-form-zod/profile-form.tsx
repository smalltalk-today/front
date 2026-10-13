'use client';

import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/ui';
import { emptyProfile, profileSchema, type ProfileInput } from './profile-schema';
import {
  ContactSection,
  PreferenceSection,
  ProfilePreview,
  ProfileSection,
} from './profile-sections';

export function ProfileForm({
  initialValues,
  onSubmit,
}: {
  initialValues?: ProfileInput;
  onSubmit: (input: ProfileInput) => Promise<void>;
}) {
  // 1. 부모에서 폼을 한 번만 생성합니다. 모든 자식은 이 인스턴스의 값을 공유합니다.
  // defaultValues는 최초 생성 시 적용됩니다. 다른 초기값을 반영하려면 reset 또는 key 변경이 필요합니다.
  const methods = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialValues ?? emptyProfile(),
  });
  const [saved, setSaved] = useState(false);
  // 4. 자식들이 등록한 이름·도시·소식 설정·연락처를 한 객체로 모아 Zod 검증 후 제출합니다.
  const submit = methods.handleSubmit(async (input) => {
    setSaved(false);
    methods.clearErrors('root');
    try {
      await onSubmit(input);
      // 저장된 값을 새 초기값으로 삼아 dirty 상태를 초기화합니다.
      methods.reset(input);
      setSaved(true);
    } catch (error) {
      // 저장 실패는 폼 전체 오류로 표시하고 사용자가 입력한 값은 유지합니다.
      methods.setError('root', { message: error instanceof Error ? error.message : '저장 실패' });
    }
  });
  return (
    // 2. FormProvider는 새 폼을 만들지 않고 부모의 methods를 자손에게 전달합니다.
    <FormProvider {...methods}>
      <form onSubmit={submit} noValidate>
        <fieldset disabled={methods.formState.isSubmitting}>
          {/* 3. 컴포넌트만 중첩됩니다. 자손에서 useForm을 다시 호출하지 않습니다. */}
          <ProfileSection />
          <PreferenceSection />
          <ContactSection />
          <ProfilePreview />
          <Button type="submit">
            {methods.formState.isSubmitting ? '저장 중…' : '프로필 저장'}
          </Button>
          <Button
            onClick={() => {
              methods.reset(initialValues ?? emptyProfile());
              setSaved(false);
            }}
          >
            초기값 복원
          </Button>
        </fieldset>
        {methods.formState.errors.root && (
          <p role="alert">{methods.formState.errors.root.message}</p>
        )}
        {saved && <p role="status">프로필을 저장했습니다.</p>}
      </form>
    </FormProvider>
  );
}
