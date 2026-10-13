# React Hook Form + Zod

## 예제 선택

| 파일                   | 용도                                                                      |
| ---------------------- | ------------------------------------------------------------------------- |
| `item-form.tsx`        | 입력 하나를 가진 독립 폼. `useForm`·resolver·submit·실패 처리 기본        |
| `registered-input.tsx` | 다른 폼에서도 재사용하는 입력. 부모가 register 결과와 오류를 props로 전달 |
| `profile-form.tsx`     | 전체 폼의 상태·초기값·검증·저장을 소유하는 최상위 컴포넌트                |
| `profile-sections.tsx` | 깊은 중첩 컴포넌트·커스텀 switch·동적 배열·미리보기                       |
| `profile-schema.ts`    | 중첩 object·배열·boolean의 Zod 검증과 타입 추론                           |

## 1. Props로 재사용 입력 연결

부모가 `useForm`을 호출하고 `register('name')`의 반환값을 RegisteredInput에 넘깁니다. 입력은 어떤 도메인의 폼인지 몰라도 됩니다. register 반환값에는 `name`, `ref`, `onChange`, `onBlur`가 포함되어 있습니다. Input은 이 props와 ref를 실제 input에 전달해야 합니다.

```tsx
const {
  register,
  formState: { errors },
} = useForm<ItemInput>({
  resolver: zodResolver(itemInputSchema),
  defaultValues: { name: '' },
});

<RegisteredInput label="이름" registration={register('name')} error={errors.name?.message} />;
```

다른 스키마를 사용하는 폼에서도 label·registration·error만 바꾸면 동일 입력을 사용할 수 있습니다. 얕은 구성에는 props 전달이 명시적이고 이해하기 쉽습니다.

## 2. 컴포넌트가 중첩되어도 RHF 인스턴스는 하나

중첩 대상은 React 컴포넌트입니다. RHF나 HTML form을 여러 겹 생성하는 예제가 아닙니다.

```text
ProfileForm                    useForm 한 번·FormProvider 한 번·form 한 개
  ProfileSection               useFormContext로 같은 폼 접근
    RegisteredInput            register 결과를 props로 전달
    AddressFields              더 깊은 자식도 useFormContext로 같은 폼 접근
      RegisteredInput          profile.address.city 입력
  PreferenceSection            같은 control의 Controller
  ContactSection               같은 control의 useFieldArray
  ProfilePreview               같은 control의 useWatch
```

이 트리의 모든 입력은 한 번의 `프로필 저장`으로 함께 제출됩니다. ProfileForm만 `useForm`을 호출합니다. FormProvider에 methods를 전달하면 자손이 `useFormContext<ProfileInput>()`로 같은 register/control/errors/reset에 접근합니다.

```tsx
// 최상위
<FormProvider {...methods}>
  <form onSubmit={methods.handleSubmit(save)}>
    <ProfileSection />
  </form>
</FormProvider>;

// 깊은 자손
const { register } = useFormContext<ProfileInput>();
register('profile.address.city');
```

`profile.address.city`는 문자열 key 자체가 아니라 중첩 경로입니다. 제출 결과는 `{ profile: { address: { city: '서울' } } }`가 됩니다. 오류도 `errors.profile?.address?.city?.message`로 읽습니다.

자손에서 다시 useForm을 호출하면 별도 폼 상태가 생성됩니다. 같은 폼을 공유하려면 useFormContext를 사용합니다. FormProvider와 HTML form을 중첩하지 않습니다. 여러 독립 폼은 각각 나란히 provider/form을 둡니다. Context의 TypeScript 제네릭은 런타임 스키마를 검증하지 않으므로 최상위와 자손의 타입을 일치시켜야 합니다.

## 3. 커스텀 컴포넌트는 Controller

PreferenceSwitch는 `checked`, `onCheckedChange`를 받는 controlled UI입니다. Controller가 RHF의 `field.value`를 checked에, `field.onChange`를 onCheckedChange에 연결합니다. `field.onBlur`와 `field.ref`도 연결해 touched 상태와 오류 focus를 지원합니다.

일반 input은 register로 충분합니다. DatePicker·Select·Switch처럼 value/onChange 계약이 다른 controlled UI는 Controller 또는 useController로 연결합니다. Controller가 담당하는 필드에 register를 추가로 적용하지 않습니다. boolean 초기값은 false이며 undefined로 시작하지 않습니다.

## 4. 배열 필드는 useFieldArray

ContactSection은 연락처 추가/삭제를 담당합니다. `register(\`contacts.${index}.email\`)`로 각 값을 등록하고 `field.id`를 React key로 사용합니다. index를 key로 쓰면 중간 삭제 후 입력과 DOM 상태가 잘못 연결될 수 있습니다.

append에는 `{ email: '' }`처럼 완전한 초기 object를 전달합니다. UI에서는 5개까지만 추가하고 스키마에서도 최대 5개를 검증합니다. 추가/삭제 버튼은 submit을 실행하지 않도록 type=button입니다. 이 프로젝트의 Button 기본값이 type=button입니다.

## 5. 필요한 필드만 useWatch

ProfilePreview는 이름 필드만 구독합니다. 최상위에서 watch로 전체 폼을 구독하는 대신 미리보기 자손에서 useWatch를 사용해 변경의 영향을 좁힙니다. 미리보기는 제출 전에 표시하는 값이고, 최종 저장값은 resolver가 검증·trim한 input입니다.

## 6. 초기값 props·reset·저장

```tsx
<ProfileForm
  key={selectedUser.id}
  initialValues={selectedUser.profileInput}
  onSubmit={saveProfile}
/>
```

이 코드는 Client Component에서 사용합니다. selectedUser와 saveProfile은 실제 데이터·저장 함수로 준비해야 합니다. defaultValues는 첫 생성 시 적용됩니다. props를 바꿨다고 사용자의 편집값이 자동 교체되지 않습니다. 다른 사용자를 편집할 때 key를 변경해 새 폼으로 시작하거나, 데이터를 확정한 뒤 `reset(nextValues)`를 명시적으로 호출합니다. effect를 사용할 경우 전체 methods 객체 대신 reset 함수를 의존성에 넣고 편집값 덮어쓰기 시점을 결정합니다.

현재 예제는 성공 시 reset(input)으로 저장값을 새 기준으로 삼아 dirty 상태를 초기화합니다. 실패 시 입력을 유지하고 root 오류를 표시합니다. `초기값 복원`은 현재 initialValues로 돌아갑니다. 제출 중 fieldset을 비활성화해 추가 수정·중복 제출을 막습니다.

Server Component에서 일반 callback 함수를 Client Component에 넘기지 않습니다. 저장 handler는 Client wrapper에서 정의하거나 실제 Server Action으로 구현합니다. Zod 클라이언트 검증에 더해 실제 서버에서도 입력을 다시 검증합니다.

[RHF Context](https://react-hook-form.com/docs/useformcontext) · [Controller](https://react-hook-form.com/docs/usecontroller/controller) · [useFieldArray](https://react-hook-form.com/docs/usefieldarray) · [useWatch](https://react-hook-form.com/docs/usewatch)
