export type TabItem = {
  label: string;
  value: string;
};

export type TabListProps = {
  tabs: TabItem[];
  value: string;
  onChange: (value: string) => void;
};
