import { cn } from '@/shared/lib/utils';

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col rounded-card border border-border-subtle p-5', className)}>
      {children}
    </div>
  );
}
