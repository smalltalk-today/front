import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MAX_SAVED_CARDS, type Card } from '@/entities/card';
import { createCardActionsStore, useCardActionsStore } from '@/features/card-actions/index.client';

function card(id = 'card-1', sentences = ['원문', '변형 1', '변형 2', '변형 3']): Card {
  return {
    id,
    category: '경제',
    title: '테스트 카드',
    publishedAt: '2026-11-11',
    summary: ['첫 요약', '둘째 요약', '셋째 요약'],
    sentences,
  };
}

const now = '2026-11-11T01:00:00.000Z';

afterEach(() => {
  useCardActionsStore.setState(useCardActionsStore.getInitialState(), true);
});

describe('card actions client memory', () => {
  it('shares state across hook instances and retains it after a route instance unmounts', () => {
    const first = renderHook(() => useCardActionsStore((state) => state.saved.length));
    const second = renderHook(() => useCardActionsStore((state) => state.saved.length));
    act(() => {
      expect(useCardActionsStore.getState().toggleSave(card(), '원문', now)).toEqual({
        ok: true,
        action: 'saved',
      });
    });
    expect(first.result.current).toBe(1);
    expect(second.result.current).toBe(1);
    first.unmount();
    const nextRoute = renderHook(() => useCardActionsStore((state) => state.saved[0]?.card.id));
    expect(nextRoute.result.current).toBe('card-1');
  });

  it('starts independent factories and the server snapshot empty', () => {
    const first = createCardActionsStore();
    const fresh = createCardActionsStore();
    first.getState().toggleSave(card(), '원문', now);
    first.getState().regenerate(card());
    expect(fresh.getState().saved).toEqual([]);
    expect(fresh.getState().sentenceIndices).toEqual({});
    expect(first.getInitialState().saved).toEqual([]);
    expect(first.getInitialState().sentenceIndices).toEqual({});
  });

  it('uses the latest synchronous state for repeated toggles', () => {
    const store = createCardActionsStore();
    const { toggleSave } = store.getState();
    expect(toggleSave(card(), '원문', now)).toEqual({ ok: true, action: 'saved' });
    expect(toggleSave(card(), '원문', now)).toEqual({ ok: true, action: 'removed' });
    expect(store.getState().saved).toEqual([]);
    expect(toggleSave(card(), '변형 1', now)).toEqual({ ok: true, action: 'saved' });
    expect(store.getState().saved).toHaveLength(1);
    expect(store.getState().saved[0]?.sentence).toBe('변형 1');
  });

  it('regenerates exactly three times without cycling or modifying a saved snapshot', () => {
    const store = createCardActionsStore();
    const input = card();
    store.getState().toggleSave(input, '원문', now);
    const snapshot = structuredClone(store.getState().saved);
    for (const index of [1, 2, 3]) {
      expect(store.getState().regenerate(input)).toEqual({
        ok: true,
        index,
        sentence: input.sentences[index],
      });
    }
    const beforeFailure = store.getState();
    expect(store.getState().regenerate(input)).toEqual({ ok: false, error: 'exhausted' });
    expect(store.getState()).toBe(beforeFailure);
    expect(store.getState().sentenceIndices[input.id]).toBe(3);
    expect(store.getState().saved).toEqual(snapshot);
    input.title = '저장 후 바뀐 제목';
    expect(store.getState().saved[0]?.card.title).toBe('테스트 카드');
  });

  it('limits regeneration to actual available variants and isolates each issue', () => {
    const store = createCardActionsStore();
    expect(store.getState().regenerate(card('single', ['원문']))).toEqual({
      ok: false,
      error: 'exhausted',
    });
    const pair = card('pair', ['원문', '두 번째']);
    expect(store.getState().regenerate(pair)).toEqual({ ok: true, index: 1, sentence: '두 번째' });
    expect(store.getState().regenerate(pair)).toEqual({ ok: false, error: 'exhausted' });
    expect(store.getState().regenerate(card('other'))).toEqual({
      ok: true,
      index: 1,
      sentence: '변형 1',
    });
    expect(store.getState().sentenceIndices.pair).toBe(1);
  });

  it('rejects invalid inputs while preserving memory and counters', () => {
    const store = createCardActionsStore();
    const initial = store.getState();
    expect(store.getState().toggleSave(card(), '없는 문장', now)).toEqual({
      ok: false,
      error: 'invalid-input',
    });
    expect(store.getState().regenerate({ ...card(), title: '' })).toEqual({
      ok: false,
      error: 'invalid-input',
    });
    expect(store.getState()).toBe(initial);
  });

  it('keeps fifty snapshots on the limit failure and can remove an existing card at the limit', () => {
    const store = createCardActionsStore();
    for (let index = 0; index < MAX_SAVED_CARDS; index += 1) {
      expect(store.getState().toggleSave(card(`card-${index}`), '원문', now).ok).toBe(true);
    }
    const beforeFailure = store.getState();
    expect(store.getState().toggleSave(card('new'), '원문', now)).toEqual({
      ok: false,
      error: 'limit',
    });
    expect(store.getState()).toBe(beforeFailure);
    expect(store.getState().saved).toHaveLength(50);
    expect(store.getState().toggleSave(card('card-0'), '원문', now)).toEqual({
      ok: true,
      action: 'removed',
    });
    expect(store.getState().toggleSave(card('new'), '원문', now)).toEqual({
      ok: true,
      action: 'saved',
    });
    expect(store.getState().saved).toHaveLength(50);
    expect(store.getState().saved[0]?.card.id).toBe('new');
  });

  it('treats object prototype names as independent issue ids', () => {
    const store = createCardActionsStore();
    for (const id of ['toString', '__proto__']) {
      expect(store.getState().regenerate(card(id))).toEqual({
        ok: true,
        index: 1,
        sentence: '변형 1',
      });
      expect(store.getState().sentenceIndices[id]).toBe(1);
    }
    expect(Object.getPrototypeOf(store.getState().sentenceIndices)).toBeNull();
    expect(Object.getPrototypeOf({})).toBe(Object.prototype);
  });
});
