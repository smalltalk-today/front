import { cva } from 'class-variance-authority';

// 탭 리스트 스타일
export const tabListStyles = cva([
  'flex items-center gap-4 border-b border-neutral-50',
  'overflow-x-auto',
]);

// 탭 스타일
export const tabStyles = cva(
  [
    'relative pb-[15px]',
    'text-label-16-r',
    'transition-colors',
    'shrink-0 whitespace-nowrap',
    'after:absolute after:bottom-0 after:left-0',
    'after:h-0.5 after:w-full',
    'after:transition-colors',
  ],
  {
    variants: {
      active: {
        true: ['text-blue-600', 'after:bg-blue-600'],
        false: ['text-neutral-600', 'after:bg-transparent'],
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);
