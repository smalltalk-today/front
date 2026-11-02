import { cva } from 'class-variance-authority';

// 버튼 종류별 스타일
export const buttonVariantStyles = {
  primary: [
    'w-full px-5 rounded-control bg-brand-primary text-white',
    'hover:bg-brand-primary-hover',
    'active:bg-brand-primary-pressed',
    'disabled:bg-surface-disabled disabled:text-neutral-400',
  ],
  secondary: [
    'w-full px-5 rounded-control bg-surface-default text-neutral-900 border border-border-medium',
    'hover:bg-surface-secondary-hover',
    'active:bg-surface-secondary-pressed',
    'disabled:bg-surface-disabled disabled:text-neutral-400',
  ],
  link: 'text-neutral-900 underline-offset-2 underline disabled:text-neutral-400',
  text: 'text-label4 text-neutral-600',
  icon: 'text-neutral-400',
} as const;

// 버튼 크기별 스타일
export const buttonSizeStyles = {
  L: 'h-13 text-label1',
  M: 'h-12 text-label3',
  S: 'h-11 text-label3',
  XS: 'h-10 text-label3',
  icon: 'size-6',
} as const;

// 버튼 종류 및 크기 타입
export type ButtonVariant = keyof typeof buttonVariantStyles;
export type ButtonSize = keyof typeof buttonSizeStyles;

// 버튼 기본 스타일 및 variant 설정
export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center',
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-brand-primary',
    'focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed',
  ],
  {
    variants: {
      variant: buttonVariantStyles,
      size: buttonSizeStyles,
    },
    defaultVariants: {
      variant: 'primary',
    },
  },
);
