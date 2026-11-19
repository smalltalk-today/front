'use client';

import { cn } from '@/shared/lib/utils';
import type { KeyboardEvent } from 'react';
import { tabListStyles, tabStyles } from './tabs.style';
import { TabListProps } from './tabs.type';

export function TabList({ tabs, value, onChange }: TabListProps) {
  function selectByKeyboard(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? tabs.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    const target = tabs[next];
    if (!target) return;
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('button[role="tab"]')
      [next]?.focus();
    onChange(target.value);
  }

  return (
    <div role="tablist" className={tabListStyles()}>
      {tabs.map((tab, index) => {
        const isActive = value === tab.value;

        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.value)}
            onKeyDown={(event) => selectByKeyboard(event, index)}
            className={cn(tabStyles({ active: isActive }))}
          >
            {tab.label}
            {isActive && (
              <span
                className="absolute inset-x-0 bottom-0 border-b-2 border-brand-primary"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
