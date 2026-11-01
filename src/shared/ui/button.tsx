import type { ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center',
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-brand-primary',
    'focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'w-full px-5 rounded-control bg-brand-primary text-white',
          'hover:bg-brand-primary-hover',
          'active:bg-brand-primary-pressed',
          'disabled:bg-surface-disabled disabled:text-neutral-400',
        ].join(' '),
        secondary: [
          'w-full px-5 rounded-control bg-surface-default text-neutral-900 border border-border-medium',
          'hover:bg-surface-secondary-hover',
          'active:bg-surface-secondary-pressed',
          'disabled:bg-surface-disabled disabled:text-neutral-400',
        ].join(' '),
        link: 'text-neutral-900 underline-offset-2 underline disabled:text-neutral-400',
        text: 'text-label4 text-neutral-600',
        icon: 'text-neutral-400',
      },
      size: {
        L: 'h-13 text-label1',
        M: 'h-12 text-label3',
        S: 'h-11 text-label3',
        XS: 'h-10 text-label3',
        icon: 'size-6',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  },
);

export function Button({
  variant,
  size,
  className,
  children,
  ...props
}: ComponentProps<'button'> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      type="button"
      className={buttonVariants({
        variant,
        size:
          variant === 'primary' || variant === 'secondary'
            ? (size ?? 'M')
            : variant === 'icon'
              ? 'icon'
              : null,
        className,
      })}
      {...props}
    >
      {children}
    </button>
  );
}
