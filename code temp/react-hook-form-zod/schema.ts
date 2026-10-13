import { z } from 'zod';

// 입력값 검증과 공백 제거를 함께 정의합니다. 폼 타입도 같은 스키마에서 추론합니다.
export const itemInputSchema = z.object({
  name: z.string().trim().min(1, '이름은 1~40자입니다.').max(40, '이름은 1~40자입니다.'),
});
export type ItemInput = z.infer<typeof itemInputSchema>;
