// @vitest-environment node
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint();
async function errors(code: string, filePath: string) {
  const [result] = await eslint.lintText(code, { filePath });
  return result?.messages.filter((message) => message.ruleId === 'fsd/import-boundaries') ?? [];
}

describe('FSD lint boundary', () => {
  it('rejects upper-layer, sibling and deep imports, including relative exports', async () => {
    expect(
      await errors(
        "import { Demo } from '@/widgets/demo'; console.log(Demo);",
        'src/entities/demo-item/model/check.ts',
      ),
    ).toHaveLength(1);
    expect(
      await errors("export { Other } from '@/entities/other';", 'src/entities/demo-item/index.ts'),
    ).toHaveLength(1);
    expect(
      await errors(
        "export { secret } from '@/shared/config/env';",
        'src/features/rename-demo-item/index.ts',
      ),
    ).toHaveLength(1);
    expect(
      await errors(
        "export { schema } from '@/entities/demo-item/model/schema';",
        'src/features/rename-demo-item/index.ts',
      ),
    ).toHaveLength(1);
    expect(
      await errors(
        "export * from '../../../widgets/demo';",
        'src/entities/demo-item/model/check.ts',
      ),
    ).toHaveLength(1);
    expect(
      await errors(
        "async function load() { return import('@/widgets/demo'); } void load;",
        'src/entities/demo-item/model/check.ts',
      ),
    ).toHaveLength(1);
  });
  it('allows lower public APIs and slice-local files', async () => {
    expect(
      await errors(
        "export { demoItemSchema } from '@/entities/demo-item';",
        'src/features/rename-demo-item/index.ts',
      ),
    ).toHaveLength(0);
    expect(
      await errors("export * from './model/schema';", 'src/entities/demo-item/index.ts'),
    ).toHaveLength(0);
  });
});

it('rejects direct fetch in route JSX while allowing API modules', async () => {
  const code = "export async function load() { return fetch('/api/items'); }";
  const [page] = await eslint.lintText(code, { filePath: 'app/example/page.tsx' });
  const [api] = await eslint.lintText(code, { filePath: 'src/entities/demo-item/api/check.ts' });
  expect(
    page?.messages.filter((message) => message.ruleId === 'no-restricted-globals'),
  ).toHaveLength(1);
  expect(
    api?.messages.filter((message) => message.ruleId === 'no-restricted-globals'),
  ).toHaveLength(0);
});
