import { demoItemSchema } from '@/entities/demo-item';
import { request } from '@/shared/api';
import { getApiUrl } from '@/shared/config';
import type { RenameItemInput } from '../model/schema';

export function renameItem(id: string, input: RenameItemInput) {
  return request(getApiUrl(`/api/demo/items/${encodeURIComponent(id)}`), demoItemSchema, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}
