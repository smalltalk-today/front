// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { validatePrConventions } from '../scripts/pr-conventions.mjs';

describe('PR conventions', () => {
  it('accepts issue-number branches and conventional Korean titles', () => {
    expect(
      validatePrConventions({
        headRef: 'chore/1-project-setup',
        title: 'chore: 프로젝트 초기 설정',
      }),
    ).toEqual([]);
    expect(
      validatePrConventions({ headRef: 'feat/12-add-profile', title: 'feat(auth): 로그인 추가' }),
    ).toEqual([]);
  });
  it('rejects missing issue numbers, reporting labels as types and empty titles', () => {
    expect(
      validatePrConventions({ headRef: 'feat/project-setup', title: 'chore: 프로젝트 초기 설정' }),
    ).toHaveLength(1);
    expect(validatePrConventions({ headRef: 'fix/2-login', title: 'bug: 수정' })).toHaveLength(1);
    expect(validatePrConventions({ headRef: 'test/3-add-cases', title: 'test: ' })).toHaveLength(1);
  });
});
