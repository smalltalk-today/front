import { z } from 'zod';
import { itemInputSchema, type ItemInput } from '../react-hook-form-zod/schema';

const itemSchema = itemInputSchema.extend({ id: z.string() });
export type Item = z.infer<typeof itemSchema>;

// 학습용 메모리 API. 실제 연결 시 shared/api의 request로 교체합니다.
export function createItemApi() {
  // 예제마다 독립적인 메모리 데이터입니다. 새 API 인스턴스 생성 시 목록이 초기화됩니다.
  let items: Item[] = [];
  let nextId = 1;
  return {
    async list(signal?: AbortSignal) {
      signal?.throwIfAborted();
      return z.array(itemSchema).parse(items);
    },
    async create(input: ItemInput) {
      // 폼 검증과 별개로 API 경계에서도 입력을 검증합니다. 실제 서버에도 같은 원칙을 적용합니다.
      const parsed = itemInputSchema.parse(input);
      const item = itemSchema.parse({ ...parsed, id: String(nextId++) });
      items = [...items, item];
      return item;
    },
  };
}
export type ItemApi = ReturnType<typeof createItemApi>;
