import { readFileSync } from 'node:fs';
import postcss from 'postcss';
import { describe, expect, it } from 'vitest';
import { cn } from '@/shared/lib/utils';
import tokens from '@/shared/lib/text-tokens.generated.json';

describe('typography tokens', () => {
  it('tracks font-size tokens from both style sheets', () => {
    const expected = new Set<string>();
    for (const file of ['typography.css', 'approved-ui.css']) {
      postcss
        .parse(readFileSync(`src/_app/styles/${file}`, 'utf8'))
        .walkDecls(/^--text-/, ({ prop }) => {
          const name = prop.slice('--text-'.length);
          if (name && !name.includes('--')) expected.add(name);
        });
    }
    expect(tokens).toEqual([...expected]);
  });

  it('merges font sizes without removing text colors', () => {
    expect(cn('text-headline-20-sb text-content-strong', 'text-headline-22-sb')).toBe(
      'text-content-strong text-headline-22-sb',
    );
  });
});
