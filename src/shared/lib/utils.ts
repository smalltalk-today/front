import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';
import textTokens from './text-tokens.generated.json';

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: textTokens,
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
