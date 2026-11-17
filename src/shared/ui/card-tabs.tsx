'use client';

import { useEffect, useId, useRef, type KeyboardEvent } from 'react';
import { cn } from '../lib/utils';

const categories = ['경제', '테크', '문화', '사회', '환경'] as const;
export type CardTabValue = 'Today Pick' | '전체' | '랭킹' | (typeof categories)[number];

interface CardTabsProps {
  mode: 'feed' | 'saved';
  selected: CardTabValue;
  onSelect: (value: CardTabValue) => void;
  panelId?: string;
}

export function CardTabs({
  mode,
  selected,
  onSelect,
  panelId = 'card-content-panel',
}: CardTabsProps) {
  const id = useId();
  const focusedRanking = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 80rem)');
    function restoreFocus() {
      if (!media.matches || !focusedRanking.current) return;
      focusedRanking.current.parentElement
        ?.querySelector<HTMLButtonElement>('button[value="Today Pick"]')
        ?.focus();
      focusedRanking.current = null;
    }
    media.addEventListener('change', restoreFocus);
    return () => media.removeEventListener('change', restoreFocus);
  }, []);
  const options: CardTabValue[] =
    mode === 'saved' ? ['전체', ...categories] : ['랭킹', 'Today Pick', ...categories];
  const current = options.includes(selected) ? selected : mode === 'saved' ? '전체' : 'Today Pick';

  function selectByKeyboard(event: KeyboardEvent<HTMLButtonElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const buttons = Array.from(
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
        'button[role="tab"]',
      ) ?? [],
    ).filter((button) => !button.disabled && getComputedStyle(button).display !== 'none');
    const index = buttons.indexOf(event.currentTarget);
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? buttons.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
    const next = buttons[nextIndex];
    const option = options.find((value) => value === next?.value);
    if (next && option) {
      next.focus();
      onSelect(option);
    }
  }

  return (
    <div
      role="tablist"
      aria-label={mode === 'saved' ? '저장 카드 카테고리' : '카드 카테고리'}
      className="flex gap-4 overflow-x-auto border-b-1 border-border-subtle bg-surface-default px-4 md:px-0"
    >
      {options.map((value, index) => (
        <button
          key={value}
          id={`${id}-tab-${index}`}
          type="button"
          role="tab"
          value={value}
          aria-selected={current === value}
          aria-controls={panelId}
          tabIndex={current === value ? 0 : -1}
          className={cn(
            'relative flex h-12 shrink-0 items-center text-label-16-r whitespace-nowrap',
            current === value ? 'text-brand-primary' : 'text-content-normal',
            value === '랭킹' && 'xl:hidden',
          )}
          onKeyDown={selectByKeyboard}
          onFocus={(event) => {
            focusedRanking.current = value === '랭킹' ? event.currentTarget : null;
          }}
          onBlur={(event) => {
            if (getComputedStyle(event.currentTarget).display !== 'none')
              focusedRanking.current = null;
          }}
          onClick={() => onSelect(value)}
        >
          {value}
          {current === value && (
            <span
              className="absolute inset-x-0 bottom-0 border-b-2 border-brand-primary"
              aria-hidden="true"
            />
          )}
        </button>
      ))}
    </div>
  );
}
