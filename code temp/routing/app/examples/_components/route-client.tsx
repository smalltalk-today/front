'use client';

import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/shared/ui';
import { parseRouteSearch, updateQueryString } from '../_lib/search';
import { ProductQueryView } from './product-query-view';

export function RouteClient({
  heading,
  showQuery = false,
}: {
  heading: string;
  showQuery?: boolean;
}) {
  // heading은 부모가 전달한 일반 props, slug는 현재 URL에서 읽은 경로 params입니다.
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  // getAll은 중복 query 값을 배열로 읽습니다. 서버와 같은 정규화 함수를 재사용합니다.
  const values = parseRouteSearch({
    q: searchParams.getAll('q'),
    page: searchParams.getAll('page'),
    tab: searchParams.getAll('tab'),
  });
  function changeTab() {
    // 읽기 전용 searchParams를 복제해 일부 key만 수정합니다. 다른 query는 보존합니다.
    const query = updateQueryString(searchParams.toString(), { tab: 'details', page: null });
    // 현재 pathname을 유지하고 history를 교체합니다. push는 새 history를 추가합니다.
    router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
  }
  return (
    <section>
      <h2>{heading}</h2>
      <p>Client params: {slug}</p>
      <p>
        Query: {values.q || '없음'} / page {values.page} / tab {values.tab}
      </p>
      <p>중복 tag: {searchParams.getAll('tag').join(', ') || '없음'}</p>
      <Button onClick={changeTab}>상세 탭으로 변경</Button>
      {/* URL에서 얻은 slug를 일반 id props로 전달하면 자식이 해당 key의 데이터를 조회합니다. */}
      {showQuery && <ProductQueryView id={slug} heading="CSR: useQuery + queryOptions" />}
    </section>
  );
}
