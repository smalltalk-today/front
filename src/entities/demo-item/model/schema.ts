import { z } from 'zod';

export interface DemoItem {
  id: string;
  name: string;
}
export interface DemoItemDto {
  id: string;
  name: string;
}
export const demoItemSchema: z.ZodType<DemoItemDto> = z.object({
  id: z.string(),
  name: z.string(),
});
export const demoItemsSchema = z.array(demoItemSchema);
