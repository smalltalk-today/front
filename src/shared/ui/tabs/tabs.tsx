'use client';

import { TabList } from './tab-list';
import type { TabsProps } from './tabs.type';

export function Tabs({ tabs, value, onChange, children }: TabsProps) {
  return (
    <div>
      <TabList tabs={tabs} value={value} onChange={onChange} />
      {children}
    </div>
  );
}
