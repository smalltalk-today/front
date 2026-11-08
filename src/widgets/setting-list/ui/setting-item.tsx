interface SettingItemProps {
  label: string;
  children: React.ReactNode;
}

export function SettingItem({ label, children }: SettingItemProps) {
  return (
    <div className="flex h-11 items-center justify-between">
      <span className="text-title-16-m text-neutral-900">{label}</span>
      {children}
    </div>
  );
}
