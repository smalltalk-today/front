import { request } from '@/shared/api';
import { productSchema } from './product-schema';

// 브라우저 Query → 이 HTTP 함수 → API Route → 서버 fixture 조회 → Zod 응답 검증.
// API Route 예제도 실제 app에 복사해야 이 상대 URL이 동작합니다.
export function getProductBrowser(id: string, signal?: AbortSignal) {
  return request(`/api/example-products/${encodeURIComponent(id)}`, productSchema, {
    signal,
    cache: 'no-store',
  });
}
