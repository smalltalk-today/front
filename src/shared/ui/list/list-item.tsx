import { cn } from '@/shared/lib/utils';

interface ListItemProps {
  children: React.ReactNode;
  className?: string;
}

export function ListItem({ children, className }: ListItemProps) {
  return <li className={cn(className)}>{children}</li>;
}
