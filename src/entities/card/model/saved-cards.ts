import { z } from 'zod';
import { cardSchema } from './card';

export const MAX_SAVED_CARDS = 50;

export const savedCardSchema = z
  .strictObject({
    card: cardSchema,
    sentence: z.string(),
    savedAt: z.iso.datetime({ offset: true }),
  })
  .refine((entry) => entry.card.sentences.includes(entry.sentence), {
    path: ['sentence'],
    message: '카드에 포함된 문장만 저장할 수 있습니다.',
  });

const savedCardsSchema = z
  .array(savedCardSchema)
  .max(MAX_SAVED_CARDS)
  .refine((cards) => new Set(cards.map((entry) => entry.card.id)).size === cards.length);

export type SavedCard = z.infer<typeof savedCardSchema>;
export type SavedCardsResult =
  { ok: true; cards: SavedCard[] } | { ok: false; error: 'invalid-input' | 'duplicate' | 'limit' };

export function addSavedCard(
  current: readonly SavedCard[],
  card: unknown,
  sentence: string,
  savedAt: string,
): SavedCardsResult {
  const existing = savedCardsSchema.safeParse(current);
  const snapshot = savedCardSchema.safeParse({ card, sentence, savedAt });
  if (!existing.success || !snapshot.success) return { ok: false, error: 'invalid-input' };
  if (existing.data.some((entry) => entry.card.id === snapshot.data.card.id))
    return { ok: false, error: 'duplicate' };
  if (existing.data.length >= MAX_SAVED_CARDS) return { ok: false, error: 'limit' };
  return { ok: true, cards: [snapshot.data, ...existing.data] };
}

export function removeSavedCard(current: readonly SavedCard[], cardId: string): SavedCardsResult {
  const existing = savedCardsSchema.safeParse(current);
  if (!existing.success) return { ok: false, error: 'invalid-input' };
  return { ok: true, cards: existing.data.filter((entry) => entry.card.id !== cardId) };
}
