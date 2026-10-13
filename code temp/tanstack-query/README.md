# Query Options·CSR·SSR

## 기본 조회·등록

`example.tsx`는 자체 QueryClientProvider와 메모리 API를 생성합니다. `queries.ts`의 itemsQueryOptions(api)를 useQuery에 전달하고, 생성 mutation 성공 시 itemKeys.all을 invalidate합니다. 저장 중 상태는 폼의 isSubmitting이 담당하며 invalidate 완료까지 mutateAsync가 대기합니다.

이 예제의 API는 인스턴스별 메모리입니다. HTTP 기반 조회는 아래 URL 예제로 비교합니다.

## URL params 기반 queryOptions

`../routing/app/examples/_lib/product-query.ts`가 공통 옵션을 정의합니다.

```ts
productQueryOptions('first');
// queryKey: ['example-product', 'first']
// queryFn: browser API 조회
// staleTime: 60_000
```

캐시 identity는 queryFn 함수 참조가 아니라 queryKey입니다. id가 달라지면 다른 항목으로 캐시합니다. 필터·페이지·사용자에 따라 응답이 달라지면 그 값도 queryKey에 포함합니다. 화면만 바꾸는 tab은 현재 API 응답을 바꾸지 않아 key에 포함하지 않습니다.

같은 옵션을 useQuery, fetchQuery, prefetchQuery, getQueryData에서 사용합니다. 옵션 factory 하나를 두면 key·타입·staleTime이 일치합니다.

```ts
await client.prefetchQuery(productQueryOptions('first')); // 오류를 throw하지 않는 사전 로딩
const product = await client.fetchQuery(productQueryOptions('first')); // 데이터 반환·실패 throw
const cached = client.getQueryData(productQueryOptions('first').queryKey);
```

위 기본 queryFn은 브라우저의 상대 URL을 사용합니다. 서버에서는 아래처럼 서버 전용 조회 함수를 대입해야 합니다.

## CSR

`../routing/app/examples/[slug]/csr/page.tsx` → RouteClient → ProductQueryView 흐름입니다. Client가 URL의 slug를 읽고 `useQuery(productQueryOptions(id))`를 호출합니다. 처음에는 캐시가 없어 로딩 UI를 표시하고 `/api/example-products/:id`를 조회합니다. API Route는 응답 DTO를 반환하고 브라우저는 Zod로 응답을 검증합니다.

예제는 실제 루트에 복사한 경우 HTTP 요청이 동작합니다. 참고 폴더에 있는 API Route는 실행되지 않습니다.

## SSR + hydration

`../routing/app/examples/[slug]/ssr/page.tsx`에서 요청마다 새 QueryClient를 만들고 조회합니다.

```tsx
const client = createQueryClient();
await client.fetchQuery({
  ...productQueryOptions(slug),
  queryFn: () => getProductServer(slug),
});

<HydrationBoundary state={dehydrate(client)}>
  <ProductQueryView id={slug} heading="SSR 결과" />
</HydrationBoundary>;
```

서버 queryFn은 DB/서버 API, 클라이언트 queryFn은 HTTP를 사용할 수 있습니다. 양쪽 **queryKey와 DTO 계약**이 동일해야 서버 캐시를 재사용합니다. getProductServer 함수 자체를 클라이언트 props로 넘기지 않습니다. dehydrate 결과만 전달합니다.

ProductQueryView는 CSR과 동일하게 useQuery를 호출합니다. hydration된 캐시가 fresh이면 즉시 데이터를 사용하며 최초 중복 요청을 줄입니다. 60초 뒤 stale이 되었다고 즉시 요청되는 것은 아닙니다. 다시 mount·설정된 refetch 계기·수동 조회 때 갱신합니다. 다시 조회 버튼은 staleTime과 관계없이 refetch합니다.

fetchQuery는 조회 실패를 throw하므로 서버 렌더링도 실패할 수 있습니다. 이 예제는 알 수 없는 id를 먼저 notFound로 처리합니다. 실제 앱은 route error.tsx 등에서 네트워크/서버 오류를 처리합니다. prefetchQuery는 오류를 throw하지 않으므로 서버 데이터 성공이 필수인 화면에는 fetchQuery가 명확합니다.

## 서버 직접 조회와 선택 기준

`../routing/app/examples/[slug]/server/page.tsx`는 서버에서만 데이터가 필요할 때의 예제입니다. QueryClient나 hydration이 없습니다. 클라이언트 갱신·공유 캐시가 필요하면 SSR Query, 최초 조회를 브라우저에서 수행해도 되면 CSR Query를 사용합니다.

서버 QueryClient는 요청별로 생성합니다. 브라우저 Providers는 기존 getQueryClient로 캐시를 재사용합니다. 인증 데이터는 사용자 전환·로그아웃 시 제거하고, dehydrated state에 비밀값을 넣지 않습니다. Next 서버 캐시와 TanStack 브라우저 캐시는 별개입니다.

[TanStack queryOptions](https://tanstack.com/query/latest/docs/framework/react/guides/query-options) · [App Router SSR](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)
