'use client';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@/shared/ui';
import { productQueryOptions } from '../_lib/product-query';

// SSR에서도 같은 컴포넌트를 사용. props에는 직렬화 가능한 값만 전달합니다.
export function ProductQueryView({ id, heading }: { id: string; heading: string }) {
  // CSR: 캐시 없음 → 로딩 UI → queryFn의 브라우저 HTTP 요청 → data 표시.
  // SSR: 서버가 같은 key로 채운 캐시를 hydration → fresh data를 바로 표시.
  // 두 방식 모두 같은 queryOptions를 사용하고 이후 refetch는 브라우저 API를 호출합니다.
  const query = useQuery(productQueryOptions(id));
  return (
    <section>
      <h2>{heading}</h2>
      {query.isPending && <p role="status">클라이언트 조회 중…</p>}
      {query.isError && <p role="alert">{query.error.message}</p>}
      {query.data && <p>{query.data.name}</p>}
      {/* 수동 refetch는 staleTime과 관계없이 재조회합니다. 중복 클릭은 isFetching으로 막습니다. */}
      <Button onClick={() => void query.refetch()} disabled={query.isFetching}>
        다시 조회
      </Button>
    </section>
  );
}
