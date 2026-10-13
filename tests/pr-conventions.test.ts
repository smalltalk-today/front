// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { validatePrConventions } from '../scripts/pr-conventions.mjs';

const context = {
  baseRef: 'dev',
  headRepository: 'smalltalk-today/front',
  repository: 'smalltalk-today/front',
};

describe('PR conventions', () => {
  it('accepts issue-number branches and conventional Korean titles', () => {
    expect(
      validatePrConventions({
        ...context,
        headRef: 'chore/1-project-setup',
        title: 'chore: 프로젝트 초기 설정',
      }),
    ).toEqual([]);
    expect(
      validatePrConventions({
        ...context,
        headRef: 'feat/12-add-profile',
        title: 'feat(auth): 로그인 추가',
      }),
    ).toEqual([]);
  });
  it('rejects missing issue numbers, reporting labels as types and empty titles', () => {
    expect(
      validatePrConventions({
        ...context,
        headRef: 'feat/project-setup',
        title: 'chore: 프로젝트 초기 설정',
      }),
    ).toHaveLength(1);
    expect(
      validatePrConventions({ ...context, headRef: 'fix/2-login', title: 'bug: 수정' }),
    ).toHaveLength(1);
    expect(
      validatePrConventions({ ...context, headRef: 'test/3-add-cases', title: 'test: ' }),
    ).toHaveLength(1);
  });

  it('accepts dev to main and main to dev synchronization', () => {
    expect(
      validatePrConventions({
        ...context,
        baseRef: 'main',
        headRef: 'dev',
        title: 'chore: main 반영',
      }),
    ).toEqual([]);
    expect(
      validatePrConventions({ ...context, headRef: 'main', title: 'chore: main 동기화' }),
    ).toEqual([]);
  });

  it('blocks a work branch from targeting main', () => {
    expect(
      validatePrConventions({
        ...context,
        baseRef: 'main',
        headRef: 'docs/3-readme',
        title: 'docs: README 정리',
      }),
    ).not.toEqual([]);
  });

  it('blocks a fork even if its branch is named dev', () => {
    expect(
      validatePrConventions({
        ...context,
        baseRef: 'main',
        headRef: 'dev',
        headRepository: 'someone/front',
        title: 'chore: main 반영',
      }),
    ).not.toEqual([]);
  });

  it('blocks unsupported PR targets', () => {
    expect(
      validatePrConventions({
        ...context,
        baseRef: 'release',
        headRef: 'feat/12-profile',
        title: 'feat: 프로필',
      }),
    ).not.toEqual([]);
  });

  it('fails closed when repository or target data is missing', () => {
    expect(
      validatePrConventions({ headRef: 'feat/12-profile', title: 'feat: 프로필' }),
    ).not.toEqual([]);
    expect(
      validatePrConventions({
        ...context,
        repository: '',
        headRef: 'feat/12-profile',
        title: 'feat: 프로필',
      }),
    ).not.toEqual([]);
  });
});
