# 참고 코드

프로젝트 루트의 `code temp`는 학습·복사용 코드입니다. Next.js 라우트로 등록되지 않으며 제품 코드에서 import하지 않습니다. TypeScript·ESLint 검사는 적용됩니다. 예제는 현재 설치된 라이브러리와 프로젝트의 공통 Button/Input을 사용합니다.

| 경로                                      | 예제                                                                          |
| ----------------------------------------- | ----------------------------------------------------------------------------- |
| `routing/app/examples/`                   | App Router·params/queryString·props·CSR·서버 직접 조회·SSR hydration          |
| `routing/navigation.tsx`                  | Client Component의 useRouter·usePathname                                      |
| `zustand/store.ts`, `zustand/example.tsx` | store factory·Context provider·selector 구독·증가/초기화                      |
| `tanstack-query/`                         | queryOptions·useQuery·useMutation·성공 후 invalidateQueries·로딩/오류/빈 목록 |
| `react-hook-form-zod/`                    | 기본 폼·재사용 입력·중첩 컴포넌트·Controller·useFieldArray·useWatch           |

## 컴포넌트 사용

`ZustandExample`과 `QueryExample`을 원하는 Client Component에 import해 렌더링합니다. 각각 자체 provider를 포함하며 다른 인스턴스와 상태를 공유하지 않습니다. QueryExample은 ItemForm을 조합하므로 조회 → 검증 → 등록 → 목록 갱신 전체 흐름을 볼 수 있습니다.

ItemForm 단독 사용 시 `onSubmit: (input: ItemInput) => Promise<void>`를 전달합니다. 저장이 실패하면 throw하고, 성공하면 resolve합니다. 성공 시 입력을 초기화하고 실패 시 오류와 기존 입력을 유지합니다.

```tsx
<ItemForm
  onSubmit={async (input) => {
    await saveItem(input);
  }}
/>
```

`saveItem`은 실제 저장 함수로 구현해야 합니다. 입력 타입은 `schema.ts`에서 추론합니다.

## 라우팅 코드 사용

`routing/app/examples`와 `routing/app/api/example-products`를 각각 실제 루트 `app`의 동일 경로로 복사하면 라우팅·HTTP 예제를 실행할 수 있습니다. 현재는 복사하지 않았으므로 해당 URL은 존재하지 않습니다. 항목은 `first`·`second`를 허용합니다. `navigation.tsx`의 NavigationExample은 복사 후 페이지에 연결해 사용합니다. 기존 루트 layout과 Providers를 그대로 활용합니다.

## 확장 예제 설명

- [Zustand 상태 공유·selector](zustand/README.md): 여러 자식의 상태 공유, 깊은 자손 접근, 단일 값/action 구독, useShallow, provider별 격리.
- [RHF를 사용하는 중첩·재사용 컴포넌트](react-hook-form-zod/README.md): FormProvider, useFormContext, register props, Controller, useFieldArray, useWatch, 초기값 props와 reset.
- [라우팅·URL·props·CSR/SSR](routing/README.md): 서버 params/searchParams, 클라이언트 URL hook, queryString 수정, 직렬화 가능한 props, 세 가지 조회 방식.
- [TanStack QueryOptions·SSR hydration](tanstack-query/README.md): 공통 queryKey/options, 서버 fetchQuery, dehydrate/HydrationBoundary, 브라우저 useQuery.

## 데이터와 상태

메모리 API는 예제 인스턴스별로 생성되며 새로고침·unmount 후 재마운트하면 초기화됩니다. 실제 HTTP·DB·영속 저장은 없습니다. 실제 API를 연결할 때 `tanstack-query/api.ts`를 `shared/api`의 request 기반 구현으로 교체하고 query key에 필요한 사용자/조회 조건을 포함합니다.

Zustand는 UI 상태, Query는 비동기 데이터, RHF는 폼 상태를 맡습니다. 서버 요청 사이에 Zustand store나 QueryClient singleton을 공유하지 않습니다. 제품으로 옮길 때 조회는 entity/api, 행동은 feature/api·model, 화면 조합은 widget에 배치합니다.

## 검증

```sh
pnpm exec vitest run tests/code-temp.test.tsx
pnpm exec vitest run tests/code-temp-advanced.test.tsx
pnpm lint
pnpm typecheck
```

공식 문서: [Next.js 라우팅](https://nextjs.org/docs/app/getting-started/layouts-and-pages), [Zustand Next.js](https://github.com/pmndrs/zustand/blob/main/docs/learn/guides/nextjs.md), [TanStack Query](https://github.com/TanStack/query/blob/main/docs/framework/react/quick-start.md), [RHF Zod resolver](https://github.com/react-hook-form/resolvers#zod).
