'use client';

import { create, type StoreApi, type UseBoundStore } from 'zustand';
import {
  addSavedCard,
  cardSchema,
  removeSavedCard,
  type Card,
  type SavedCard,
  type SavedCardsResult,
} from '@/entities/card';

export type ToggleSaveResult =
  { ok: true; action: 'saved' | 'removed' } | Extract<SavedCardsResult, { ok: false }>;
export type RegenerateResult =
  | { ok: true; index: number; sentence: string }
  | { ok: false; error: 'invalid-input' | 'exhausted' };

export interface CardActionsState {
  saved: SavedCard[];
  sentenceIndices: Record<string, number>;
  toggleSave: (card: Card, sentence: string, nowISO: string) => ToggleSaveResult;
  clearSaved: () => void;
  regenerate: (card: Card) => RegenerateResult;
}

function copyIndices(values: Record<string, number> = {}): Record<string, number> {
  const copy = { ...values };
  // 이슈 id가 prototype 이름이어도 독립적인 숫자 인덱스로 다룬다.
  Object.setPrototypeOf(copy, null);
  return copy;
}

export function createCardActionsStore(): UseBoundStore<StoreApi<CardActionsState>> {
  return create<CardActionsState>((set, get) => ({
    saved: [],
    sentenceIndices: copyIndices(),
    clearSaved: () => set({ saved: [] }),
    toggleSave: (card, sentence, nowISO) => {
      const current = get().saved;
      const isSaved = current.some((entry) => entry.card.id === card.id);
      const result = isSaved
        ? removeSavedCard(current, card.id)
        : addSavedCard(current, card, sentence, nowISO);
      if (!result.ok) return result;
      set({ saved: result.cards });
      return { ok: true, action: isSaved ? 'removed' : 'saved' };
    },
    regenerate: (card) => {
      const parsed = cardSchema.safeParse(card);
      if (!parsed.success) return { ok: false, error: 'invalid-input' };
      const indices = get().sentenceIndices;
      const nextIndex = (Object.hasOwn(indices, card.id) ? (indices[card.id] ?? 0) : 0) + 1;
      const sentence = parsed.data.sentences[nextIndex];
      if (nextIndex > Math.min(3, parsed.data.sentences.length - 1) || sentence === undefined)
        return { ok: false, error: 'exhausted' };
      const nextIndices = copyIndices(indices);
      nextIndices[card.id] = nextIndex;
      set({ sentenceIndices: nextIndices });
      return { ok: true, index: nextIndex, sentence };
    },
  }));
}

export const useCardActionsStore = createCardActionsStore();
