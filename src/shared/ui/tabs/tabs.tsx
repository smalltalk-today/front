'use client';

import { cn } from '@/shared/lib/utils';
import { tabListStyles, tabStyles } from './tabs.style';
import { TabsProps } from './tabs.type';

export function Tabs({ tabs, value, onChange }: TabsProps) {
  return (
    <div role="tablist" className={tabListStyles()}>
      {tabs.map((tab) => {
        const isActive = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.value)}
            className={cn(tabStyles({ active: isActive }))}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
