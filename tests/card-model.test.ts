// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  addSavedCard,
  cardSchema,
  formatCardDate,
  MAX_SAVED_CARDS,
  removeSavedCard,
  type Card,
  type SavedCard,
} from '@/entities/card';

function card(id = 'card-1'): Card {
  return {
    id,
    category: '경제',
    title: '카드 제목',
    publishedAt: '2026-11-11',
    summary: ['첫 번째 요약', '두 번째 요약', '세 번째 요약'],
    sentences: ['첫 문장', '다른 문장'],
    sourceUrl: 'https://example.com/news/1',
  };
}

function saved(id = 'card-1', savedAt = '2026-11-11T01:00:00.000Z'): SavedCard {
  return { card: card(id), sentence: '첫 문장', savedAt };
}

const now = '2026-11-11T02:00:00.000Z';

describe('card boundary', () => {
  it('accepts five categories, three summaries, one to four sentences and an optional source', () => {
    for (const category of ['경제', '테크', '문화', '사회', '환경']) {
      expect(cardSchema.safeParse({ ...card(), category }).success).toBe(true);
    }
    expect(cardSchema.parse({ ...card(), sourceUrl: undefined }).sourceUrl).toBeUndefined();
    expect(cardSchema.safeParse({ ...card(), sentences: ['원문'] }).success).toBe(true);
    expect(cardSchema.safeParse({ ...card(), sentences: ['원문', '1', '2', '3'] }).success).toBe(
      true,
    );
  });

  it('rejects invalid dates, category, empty content, summary count and sentence limits', () => {
    for (const override of [
      { publishedAt: '2026-02-30' },
      { publishedAt: '2026/11/11' },
      { category: '미등록' },
      { title: '   ' },
      { id: '' },
      { summary: ['첫째', '둘째'] },
      { sentences: [] },
      { sentences: ['원문', '1', '2', '3', '4'] },
    ]) {
      expect(cardSchema.safeParse({ ...card(), ...override }).success).toBe(false);
    }
  });

  it('only accepts HTTP(S) source URLs without transforming the card', () => {
    for (const sourceUrl of [
      'javascript:alert(1)',
      'file:///tmp/card',
      'ftp://example.com/card',
      'bad',
    ]) {
      expect(cardSchema.safeParse({ ...card(), sourceUrl }).success).toBe(false);
    }
    expect(
      cardSchema.safeParse({ ...card(), sourceUrl: ' https://example.com/news' }).success,
    ).toBe(false);
    const value = { ...card(), title: ' 제목 ', sourceUrl: 'http://example.com/news?x=1' };
    expect(cardSchema.parse(value)).toEqual(value);
  });
});

describe('saved card memory model', () => {
  it('prepends a detached snapshot with the selected sentence and leaves its inputs unchanged', () => {
    const current = [saved('old')];
    const before = structuredClone(current);
    const input = card('new');
    const result = addSavedCard(current, input, '다른 문장', now);
    expect(result).toEqual({
      ok: true,
      cards: [{ card: input, sentence: '다른 문장', savedAt: now }, ...before],
    });
    expect(current).toEqual(before);
    if (!result.ok) return;
    expect(result.cards).not.toBe(current);
    expect(result.cards[1]).not.toBe(current[0]);
    input.title = '이후 변경';
    input.summary[0] = '이후 요약';
    input.sentences[0] = '이후 문장';
    current[0]!.card.title = '이후 기존 항목 변경';
    expect(result.cards[0]?.card.title).toBe('카드 제목');
    expect(result.cards[0]?.card.summary[0]).toBe('첫 번째 요약');
    expect(result.cards[0]?.sentence).toBe('다른 문장');
    expect(result.cards[1]).toEqual(before[0]);
  });

  it('does not replace an existing id with newer content or another sentence', () => {
    const current = [saved()];
    const before = structuredClone(current);
    expect(addSavedCard(current, { ...card(), title: '새 제목' }, '다른 문장', now)).toEqual({
      ok: false,
      error: 'duplicate',
    });
    expect(current).toEqual(before);
  });

  it('keeps all 50 snapshots when card 51 is refused and permits adding after removal', () => {
    const current = Array.from({ length: MAX_SAVED_CARDS }, (_, i) => saved(`card-${i}`));
    const before = structuredClone(current);
    expect(addSavedCard(current, card('new'), '첫 문장', now)).toEqual({
      ok: false,
      error: 'limit',
    });
    expect(current).toEqual(before);
    const removed = removeSavedCard(current, 'card-0');
    expect(removed.ok).toBe(true);
    if (!removed.ok) return;
    const result = addSavedCard(removed.cards, card('new'), '첫 문장', now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.cards).toHaveLength(50);
    expect(result.cards[0]?.card.id).toBe('new');
    expect(result.cards.some((entry) => entry.card.id === 'card-0')).toBe(false);
    expect(result.cards.some((entry) => entry.card.id === 'card-49')).toBe(true);
  });

  it('refuses an invalid card, date or a sentence absent from the card without changing state', () => {
    const current = [saved('old')];
    const before = structuredClone(current);
    expect(addSavedCard(current, card(), '임의 문장', now)).toEqual({
      ok: false,
      error: 'invalid-input',
    });
    expect(addSavedCard(current, card(), '첫 문장', 'bad')).toEqual({
      ok: false,
      error: 'invalid-input',
    });
    expect(
      addSavedCard(current, { ...card(), sourceUrl: 'javascript:alert(1)' }, '첫 문장', now),
    ).toEqual({ ok: false, error: 'invalid-input' });
    expect(current).toEqual(before);
  });

  it('rejects duplicate or oversized input state at the model boundary', () => {
    const duplicate = [saved(), saved()];
    const tooMany = Array.from({ length: MAX_SAVED_CARDS + 1 }, (_, i) => saved(`card-${i}`));
    for (const current of [duplicate, tooMany]) {
      const before = structuredClone(current);
      expect(addSavedCard(current, card('new'), '첫 문장', now)).toEqual({
        ok: false,
        error: 'invalid-input',
      });
      expect(removeSavedCard(current, 'card-1')).toEqual({ ok: false, error: 'invalid-input' });
      expect(current).toEqual(before);
    }
  });

  it('returns a new snapshot array while removing only the requested id', () => {
    const current = [saved('one'), saved('two')];
    const before = structuredClone(current);
    const missing = removeSavedCard(current, 'missing');
    expect(missing).toEqual({ ok: true, cards: before });
    if (!missing.ok) return;
    expect(missing.cards).not.toBe(current);
    expect(missing.cards[0]).not.toBe(current[0]);
    expect(removeSavedCard(current, 'one')).toEqual({ ok: true, cards: [before[1]] });
    expect(current).toEqual(before);
    expect(removeSavedCard([saved()], 'card-1')).toEqual({ ok: true, cards: [] });
  });
});

describe('card date labels', () => {
  it.each([
    ['2026-11-11', '2026-11-11', '오늘'],
    ['2026-12-01', '2026-11-11', '오늘'],
    ['2026-11-10', '2026-11-11', '1일 전'],
    ['2026-10-31', '2026-11-01', '1일 전'],
    ['2024-02-29', '2024-03-01', '1일 전'],
    ['2025-12-31', '2026-01-01', '1일 전'],
    ['2026-10-13', '2026-11-11', '29일 전'],
    ['2026-10-12', '2026-11-11', '1달 전'],
    ['2026-09-13', '2026-11-11', '1달 전'],
    ['2026-09-12', '2026-11-11', '2달 전'],
    ['2025-11-12', '2026-11-11', '12달 전'],
    ['2025-11-11', '2026-11-11', '1년 전'],
    ['2024-11-11', '2026-11-11', '2년 전'],
  ])('preserves the original label for %s relative to %s: %s', (publishedAt, today, expected) => {
    expect(formatCardDate(publishedAt, today)).toBe(expected);
  });

  it('returns an empty label for invalid dates without host timezone coercion', () => {
    expect(formatCardDate('2026-02-30', '2026-11-11')).toBe('');
    expect(formatCardDate('2026-11-11', 'invalid')).toBe('');
    expect(formatCardDate('invalid', 'invalid')).toBe('');
  });
});
