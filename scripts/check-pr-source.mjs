import { readFile } from 'node:fs/promises';
import { validatePrBranchFlow } from './pr-conventions.mjs';

const { GITHUB_EVENT_PATH, GITHUB_REPOSITORY, GH_TOKEN } = process.env;
if (!GITHUB_EVENT_PATH || !GITHUB_REPOSITORY || !GH_TOKEN) {
  throw new Error('GitHub 이벤트·저장소·인증 정보가 필요합니다.');
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
// pull_request_target runs on the default branch; publish the status on the PR head explicitly.
const response = await fetch(
  `${process.env.GITHUB_API_URL ?? 'https://api.github.com'}/repos/${GITHUB_REPOSITORY}/statuses/${pr.head.sha}`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      state: errors.length ? 'failure' : 'success',
      context: 'main-source',
      description: errors.length ? errors[0] : '같은 저장소의 dev → main PR 확인',
    }),
    signal: AbortSignal.timeout(10000),
  },
);
if (!response.ok) throw new Error(`main-source 상태 등록 실패: HTTP ${response.status}`);
if (errors.length) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log('PASS: dev → main 출발 브랜치 확인');
}
