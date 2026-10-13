import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { getProductServer, isProductId } from '../../_lib/product-data.server';
import { parseRouteSearch, type RouteSearch } from '../../_lib/search';

export default async function ServerOnlyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RouteSearch>;
}) {
  // 서버에서만 데이터를 사용할 때의 예제입니다. Query 캐시나 hydration은 필요 없습니다.
  // 요청 시 실행 → URL props 확인 → 서버 API/DB 조회 → HTML에 데이터 표시.
  await connection();
  const { slug } = await params;
  if (!isProductId(slug)) notFound();
  const search = parseRouteSearch(await searchParams);
  // 서버 전용 함수는 서버에서만 호출합니다. 반환값을 JSX에 직접 사용합니다.
  const product = await getProductServer(slug);
  return (
    <section>
      <h1>서버 직접 조회: {product.name}</h1>
      <p>
        검색: {search.q || '없음'} / page {search.page}
      </p>
    </section>
  );
}
