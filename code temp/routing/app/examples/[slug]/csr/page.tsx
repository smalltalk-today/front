import { Suspense } from 'react';
import { RouteClient } from '../../_components/route-client';

// 데이터 흐름: RouteClient의 useParams → ProductQueryView → queryOptions → 브라우저 API 요청.
// 이 page는 서버에서 데이터를 미리 조회하지 않습니다. use client만으로 순수 CSR이 되는 것은 아닙니다.
export default function CsrExamplePage() {
  return (
    // useSearchParams를 읽는 Client 영역을 감싸 URL 준비 전 fallback을 표시합니다.
    <Suspense fallback={<p role="status">URL 준비 중…</p>}>
      <RouteClient heading="서버가 전달한 일반 props" showQuery />
    </Suspense>
  );
}
