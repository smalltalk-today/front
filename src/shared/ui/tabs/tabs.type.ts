import type { ReactNode } from 'react';

export type TabItem = {
  label: string;
  value: string;
};

export type TabListProps = {
  tabs: TabItem[];
  value: string;
  onChange: (value: string) => void;
};

export type TabsProps = TabListProps & {
  children: ReactNode;
};

export type TabContentProps = {
  children: ReactNode;
};
