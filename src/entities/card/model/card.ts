import { z } from 'zod';

export const CARD_CATEGORIES = ['경제', '테크', '문화', '사회', '환경'] as const;

const isoDate = z.iso.date();
const content = z.string().refine((value) => value.trim().length > 0, '내용이 필요합니다.');
const sourceUrl = z
  .string()
  .refine((value) => value === value.trim(), 'URL 앞뒤에 공백을 사용할 수 없습니다.')
  .pipe(z.url({ protocol: /^https?$/ }));

export const cardSchema = z.strictObject({
  id: content,
  category: z.enum(CARD_CATEGORIES),
  title: content,
  publishedAt: isoDate,
  summary: z.tuple([content, content, content]),
  sentences: z.array(content).min(1).max(4),
  sourceUrl: sourceUrl.optional(),
});

export type Card = z.infer<typeof cardSchema>;
export type CardCategory = Card['category'];

export function formatCardDate(publishedAt: string, todayISO: string): string {
  const date = isoDate.safeParse(publishedAt);
  const today = isoDate.safeParse(todayISO);
  if (!date.success || !today.success) return '';
  const days =
    (Date.parse(`${today.data}T00:00:00Z`) - Date.parse(`${date.data}T00:00:00Z`)) / 86_400_000;
  if (days <= 0) return '오늘';
  if (days < 30) return `${days}일 전`;
  if (days < 365) return `${Math.floor(days / 30)}달 전`;
  return `${Math.floor(days / 365)}년 전`;
}
