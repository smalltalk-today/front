import { cn } from '@/shared/lib/utils';

interface ListProps {
  children: React.ReactNode;
  className?: string;
}

export function List({ children, className }: ListProps) {
  return <ul className={cn('flex flex-col', className)}>{children}</ul>;
}
