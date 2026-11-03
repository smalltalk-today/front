export type TabItem = {
  label: string;
  value: string;
};

export type TabsProps = {
  tabs: TabItem[];
  value: string;
  onChange: (value: string) => void;
};
