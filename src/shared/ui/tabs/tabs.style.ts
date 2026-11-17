import { cva } from 'class-variance-authority';

export const tabListStyles = cva(
  'flex gap-4 overflow-x-auto border-b-1 border-border-subtle bg-surface-default px-4 md:px-0',
);

export const tabStyles = cva(
  'relative flex h-12 shrink-0 items-center text-label-16-r whitespace-nowrap',
  {
    variants: {
      active: {
        true: 'text-brand-primary',
        false: 'text-content-normal',
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);
