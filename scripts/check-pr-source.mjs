import { readFile } from 'node:fs/promises';
import { validatePrBranchFlow } from './pr-conventions.mjs';

const { GITHUB_EVENT_PATH, GITHUB_REPOSITORY } = process.env;
if (!GITHUB_EVENT_PATH || !GITHUB_REPOSITORY) {
  throw new Error('GitHub 이벤트·저장소 정보가 필요합니다.');
}
const event = JSON.parse(await readFile(GITHUB_EVENT_PATH, 'utf8'));
const pr = event.pull_request;
if (pr?.base?.ref !== 'main' || !/^[a-f0-9]{40}$/.test(pr?.head?.sha ?? '')) {
  throw new Error('main 대상 PR과 올바른 head SHA가 필요합니다.');
}
const errors = validatePrBranchFlow({
  baseRef: pr.base.ref,
  headRef: pr.head.ref,
  headRepository: pr.head.repo?.full_name,
  repository: GITHUB_REPOSITORY,
});
if (errors.length) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log('PASS: dev → main 출발 브랜치 확인');
}
