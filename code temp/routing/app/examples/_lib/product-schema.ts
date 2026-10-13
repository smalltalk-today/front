import { z } from 'zod';

// 서버 fixture와 브라우저 응답이 같은 DTO 계약을 사용해야 동일 Query 캐시로 다룰 수 있습니다.
export const productSchema = z.object({ id: z.string(), name: z.string() });
export type Product = z.infer<typeof productSchema>;
