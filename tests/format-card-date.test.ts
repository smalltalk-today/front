import { describe, expect, it } from 'vitest';
import { formatCardDate } from '@/entities/card';

const now = new Date('2026-11-05T03:00:00Z');

describe('formatCardDate', () => {
  it.each([
    [0, '오늘'],
    [1, '1일 전'],
    [13, '13일 전'],
    [29, '29일 전'],
    [30, '1달 전'],
    [59, '1달 전'],
    [60, '2달 전'],
    [360, '12달 전'],
    [364, '12달 전'],
    [365, '1년 전'],
    [729, '1년 전'],
    [730, '2년 전'],
    [-1, '오늘'],
  ])('%i일 차이 → %s', (days, expected) => {
    expect(formatCardDate(new Date(now.getTime() - days * 86_400_000), now)).toBe(expected);
  });

  it('한국 자정이 지나면 24시간 미만이어도 1일 전으로 표시한다', () => {
    expect(formatCardDate('2026-11-04T14:59:59Z', '2026-11-04T15:00:00Z')).toBe('1일 전');
    expect(formatCardDate('2026-11-04T15:00:00Z', now)).toBe('오늘');
  });

  it('잘못된 날짜는 빈 문자열로 표시한다', () => {
    expect(formatCardDate('', now)).toBe('');
    expect(formatCardDate(new Date('invalid'), now)).toBe('');
    expect(formatCardDate(now, 'invalid')).toBe('');
  });

  it('현재 시각 생략과 타임스탬프 입력을 지원한다', () => {
    expect(formatCardDate(Date.now())).toBe('오늘');
  });
});
