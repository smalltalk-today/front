export const branchPattern =
  '^(feat|fix|refactor|docs|style|chore|test)/[1-9][0-9]*-[a-z0-9]+(-[a-z0-9]+)*$';
const titlePattern = /^(feat|fix|refactor|docs|style|chore|test)(\([a-z0-9][a-z0-9-]*\))?!?: \S.*$/;

export function validatePrBranchFlow({ baseRef, headRef, headRepository, repository }) {
  if (!repository || headRepository !== repository) {
    return ['PR은 같은 저장소의 브랜치에서 생성해야 합니다.'];
  }
  if (baseRef === 'main') {
    return headRef === 'dev' ? [] : ['main 대상 PR은 dev 브랜치에서만 생성해야 합니다.'];
  }
  if (baseRef !== 'dev') return ['PR 대상 브랜치는 dev 또는 main이어야 합니다.'];
  if (
    headRef === 'main' ||
    (typeof headRef === 'string' && new RegExp(branchPattern).test(headRef))
  ) {
    return [];
  }
  return ['작업 브랜치는 type/이슈번호-kebab-case 형식이어야 합니다. 예: chore/1-project-setup'];
}

export function validatePrConventions({ title, ...context }) {
  const errors = validatePrBranchFlow(context);
  if (typeof title !== 'string' || !titlePattern.test(title)) {
    errors.push(
      'PR 제목은 type: 내용 형식이어야 합니다. type: feat, fix, refactor, docs, style, chore, test',
    );
  }
  return errors;
}
