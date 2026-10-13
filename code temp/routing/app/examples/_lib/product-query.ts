import { queryOptions } from '@tanstack/react-query';
import { getProductBrowser } from './product-api';

// CSR/SSR이 공유하는 조회 계약입니다. 옵션을 만드는 것만으로 HTTP 요청이 실행되지는 않습니다.
// useQuery 또는 QueryClient.fetchQuery가 이 옵션을 받아 캐시 확인·실제 조회를 수행합니다.
export function productQueryOptions(id: string) {
  return queryOptions({
    // id가 달라지면 별도 캐시입니다. 서버와 브라우저가 동일 key를 써야 hydration을 재사용합니다.
    queryKey: ['example-product', id] as const,
    // CSR·브라우저 재조회용 함수입니다. SSR page에서는 서버 조회 함수로 교체합니다.
    // Query가 전달하는 signal을 HTTP 요청에 넘겨 취소를 지원합니다.
    queryFn: ({ signal }) => getProductBrowser(id, signal),
    // hydration된 데이터가 60초 동안 fresh이므로 mount 직후 불필요한 중복 조회를 줄입니다.
    // 시간이 지났다고 즉시 요청하지는 않습니다. refetch 계기가 있어야 갱신됩니다.
    staleTime: 60_000,
  });
}
