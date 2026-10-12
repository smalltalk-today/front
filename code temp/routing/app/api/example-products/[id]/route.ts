import { getProductServer, isProductId } from '../../../examples/_lib/product-data.server';

// 브라우저의 /api/example-products/:id 요청을 서버 조회 함수에 연결하는 HTTP 경계입니다.
// [id] 폴더가 params.id를 만듭니다. 이 Route Handler도 Promise params를 await합니다.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isProductId(id)) return Response.json({ message: '항목 없음' }, { status: 404 });
  // HTTP 캐시는 사용하지 않습니다. 브라우저 Query 캐시의 staleTime과는 별도 정책입니다.
  return Response.json(await getProductServer(id), { headers: { 'Cache-Control': 'no-store' } });
}
