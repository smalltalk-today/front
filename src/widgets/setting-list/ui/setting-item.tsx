interface SettingItemProps {
  label: string;
  children: React.ReactNode;
}

export function SettingItem({ label, children }: SettingItemProps) {
  return (
    <div className="flex h-11 items-center justify-between">
      <span className="text-body-16-r font-medium text-neutral-900">{label}</span>
      {children}
    </div>
  );
}
