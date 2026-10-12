import { queryOptions } from '@tanstack/react-query';
import { request } from '@/shared/api';
import { getApiUrl } from '@/shared/config';
import { demoItemsSchema, type DemoItem } from '../model/schema';

export const demoItemKeys = { all: ['demo-items'] as const };
export function demoItemsQueryOptions() {
  return queryOptions({
    queryKey: demoItemKeys.all,
    queryFn: async ({ signal }): Promise<DemoItem[]> => {
      const items = await request(getApiUrl('/api/demo/items'), demoItemsSchema, { signal });
      return items.map(({ id, name }) => ({ id, name }));
    },
  });
}
