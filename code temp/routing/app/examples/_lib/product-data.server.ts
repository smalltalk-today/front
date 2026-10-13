// Client Component에서 잘못 import하면 빌드가 실패하도록 서버 경계를 보호합니다.
import 'server-only';
import { productSchema } from './product-schema';

// 실제 사용 시 서버 API/DB 조회로 교체. 브라우저에는 이 모듈을 import하지 않습니다.
export async function getProductServer(id: string) {
  const names: Record<string, string> = { first: '첫 항목', second: '두 번째 항목' };
  const name = names[id];
  if (!name) throw new Error('항목을 찾을 수 없습니다.');
  return productSchema.parse({ id, name });
}

// 허용한 id만 조회해 잘못된 URL을 page/API Route에서 404로 처리합니다.
export function isProductId(id: string) {
  return id === 'first' || id === 'second';
}
