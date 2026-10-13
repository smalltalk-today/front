import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { createQueryClient } from '@/shared/lib/query';
import { ProductQueryView } from '../../_components/product-query-view';
import { getProductServer, isProductId } from '../../_lib/product-data.server';
import { productQueryOptions } from '../../_lib/product-query';
import { parseRouteSearch, type RouteSearch } from '../../_lib/search';

export default async function SsrQueryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RouteSearch>;
}) {
  // 1. 빌드 시 미리 생성하는 대신 실제 요청을 받은 뒤 서버에서 실행합니다.
  await connection();
  // 2. 서버 page props는 Promise입니다. URL 경로와 queryString을 await해 읽습니다.
  const { slug } = await params;
  const search = parseRouteSearch(await searchParams);
  if (!isProductId(slug)) notFound();
  // 3. 요청마다 새 캐시를 만들어 다른 사용자/요청의 데이터가 섞이지 않게 합니다.
  const client = createQueryClient();
  // 4. 공통 queryOptions의 key/staleTime는 유지하고 queryFn만 서버 전용 API/DB 조회로 교체합니다.
  // 서버에서 상대 URL HTTP 호출을 하지 않습니다. fetchQuery는 데이터 조회와 캐시 저장을 함께 수행합니다.
  // 실패 시 throw하므로 실제 앱에서는 route error.tsx 등으로 처리합니다.
  await client.fetchQuery({ ...productQueryOptions(slug), queryFn: () => getProductServer(slug) });
  return (
    // 5. dehydrate로 캐시 데이터를 직렬화해 전달하고 HydrationBoundary로 Query 캐시에 복원합니다.
    // QueryClient나 서버 queryFn 자체를 Client Component props로 전달하지 않습니다.
    <HydrationBoundary state={dehydrate(client)}>
      <p>
        서버에서 읽은 queryString: {search.tab} / page {search.page}
      </p>
      {/* 6. 자식 useQuery가 동일 key의 서버 데이터를 사용합니다. 이후 조회는 브라우저 queryFn 담당. */}
      <ProductQueryView id={slug} heading="SSR 데이터 → Query hydration → 브라우저 갱신" />
    </HydrationBoundary>
  );
}
