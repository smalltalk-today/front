import { delay, http, HttpResponse } from 'msw';
import { z } from 'zod';
import type { DemoItemDto } from '@/entities/demo-item';

export function createDemoHandlers() {
  let items: DemoItemDto[] = [{ id: '1', name: '첫 번째 항목' }];
  return [
    http.get('*/api/demo/items', async () => {
      await delay(30);
      return HttpResponse.json(items);
    }),
    http.patch('*/api/demo/items/:id', async ({ params, request }) => {
      const body: unknown = await request.json();
      const parsed = z.object({ name: z.string().trim().min(1).max(40) }).safeParse(body);
      if (!parsed.success) return new HttpResponse(null, { status: 400 });
      const item = items.find((item) => item.id === params.id);
      if (!item) return new HttpResponse(null, { status: 404 });
      const updated = { ...item, name: parsed.data.name };
      items = items.map((entry) => (entry.id === item.id ? updated : entry));
      return HttpResponse.json(updated);
    }),
  ];
}
