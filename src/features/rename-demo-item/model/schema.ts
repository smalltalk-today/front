import { z } from 'zod';
export const renameItemSchema = z.object({
  name: z.string().trim().min(1, '이름은 1~40자입니다.').max(40, '이름은 1~40자입니다.'),
});
export type RenameItemInput = z.infer<typeof renameItemSchema>;
