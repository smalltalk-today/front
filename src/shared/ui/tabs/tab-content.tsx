import { TabContentProps } from './tabs.type';

export function TabContent({ children }: TabContentProps) {
  return <div role="tabpanel">{children}</div>;
}
