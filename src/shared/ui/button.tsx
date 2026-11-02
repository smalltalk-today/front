import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';
import { buttonVariants } from './button.style';

type ButtonProps = ComponentProps<'button'> &
  (
    | {
        variant?: 'primary' | 'secondary';
        size?: 'L' | 'M' | 'S' | 'XS';
      }
    | {
        variant: 'icon';
        size?: never;
      }
    | {
        variant: 'link' | 'text';
        size?: never;
      }
  );

export function Button({ variant, size, className, children, ...props }: ButtonProps) {
  const buttonSize =
    variant === 'primary' || variant === 'secondary'
      ? (size ?? 'M')
      : variant === 'icon'
        ? 'icon'
        : null;

  return (
    <button
      type="button"
      className={cn(
        buttonVariants({
          variant,
          size: buttonSize,
        }),
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
