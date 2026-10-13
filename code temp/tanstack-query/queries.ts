import { queryOptions } from '@tanstack/react-query';
import type { ItemApi } from './api';

export const itemKeys = { all: ['example-items'] as const };
// Query 옵션을 한곳에 정의합니다. 생성만으로 조회하지 않고 useQuery/fetchQuery에 전달합니다.
// 이 예제는 인스턴스별 메모리 API이므로 해당 QueryClient도 예제마다 분리합니다.
export function itemsQueryOptions(api: ItemApi) {
  return queryOptions({
    queryKey: itemKeys.all,
    queryFn: ({ signal }) => api.list(signal),
  });
}
