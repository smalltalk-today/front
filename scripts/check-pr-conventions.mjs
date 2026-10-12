import { readFile } from 'node:fs/promises';
import { validatePrConventions } from './pr-conventions.mjs';

const eventPath = process.env.GITHUB_EVENT_PATH;
if (!eventPath) throw new Error('GITHUB_EVENT_PATH가 필요합니다.');
const event = JSON.parse(await readFile(eventPath, 'utf8'));
const errors = validatePrConventions({
  headRef: event.pull_request?.head?.ref,
  title: event.pull_request?.title,
});
if (errors.length) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log('PASS: 브랜치·PR 제목 규칙 확인');
}
