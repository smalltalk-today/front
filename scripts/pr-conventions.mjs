export const branchPattern =
  '^(feat|fix|refactor|docs|style|chore|test)/[1-9][0-9]*-[a-z0-9]+(-[a-z0-9]+)*$';
const titlePattern = /^(feat|fix|refactor|docs|style|chore|test)(\([a-z0-9][a-z0-9-]*\))?!?: \S.*$/;

export function validatePrConventions({ headRef, title }) {
  const errors = [];
  if (typeof headRef !== 'string' || !new RegExp(branchPattern).test(headRef)) {
    errors.push(
      '브랜치 이름은 type/이슈번호-kebab-case 형식이어야 합니다. 예: chore/1-project-setup',
    );
  }
  if (typeof title !== 'string' || !titlePattern.test(title)) {
    errors.push(
      'PR 제목은 type: 내용 형식이어야 합니다. type: feat, fix, refactor, docs, style, chore, test',
    );
  }
  return errors;
}
