import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { RouteClient } from '../_components/route-client';
import { parseRouteSearch, type RouteSearch } from '../_lib/search';
import { isProductId } from '../_lib/product-data.server';

export default async function ExamplePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RouteSearch>;
}) {
  // /examples/first?page=2 → params.slug=first, searchParams.page="2".
  // 일반 자식에는 이 route props가 자동 전달되지 않아 필요한 값을 직접 넘깁니다.
  const { slug } = await params;
  const search = parseRouteSearch(await searchParams);
  if (!isProductId(slug)) notFound();
  return (
    <section>
      <h1>{slug}</h1>
      <p>
        서버 props: slug={slug}, tab={search.tab}, page={search.page}, q={search.q}
      </p>
      <Suspense fallback={<p>URL 준비 중…</p>}>
        {/* 서버에서 계산한 문자열은 직렬화 가능한 일반 props로 Client Component에 전달합니다. */}
        <RouteClient heading={`서버에서 계산한 제목: ${slug}`} />
      </Suspense>
      <nav aria-label="조회 방식 비교">
        <Link href={`/examples/${slug}/csr?q=hello&page=2`}>CSR 조회</Link>{' '}
        <Link href={`/examples/${slug}/server?q=hello&page=2`}>서버 직접 조회</Link>{' '}
        <Link href={`/examples/${slug}/ssr?tab=details`}>SSR + Query hydration</Link>
      </nav>
    </section>
  );
}
