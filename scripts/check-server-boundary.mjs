import { mkdir, rm, writeFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const route = new URL('../app/boundary-check/', import.meta.url);
try {
  await access(route);
  throw new Error('boundary-check 경로가 이미 존재합니다.');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
try {
  await mkdir(route);
  await writeFile(
    new URL('page.tsx', route),
    `
'use client';
import { getServerEnv } from '@/shared/config/index.server';
export default function BoundaryCheck() { return <p>{getServerEnv().siteUrl}</p>; }
`,
  );
  const result = spawnSync('pnpm', ['build'], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  if (result.error) throw result.error;
  if (result.status === 0 || !output.includes('server-only')) {
    throw new Error(`서버 경계 실패를 확인하지 못했습니다.\n${output}`);
  }
  console.log('PASS: Client Component의 server-only import가 빌드에서 차단됨.');
} finally {
  await rm(route, { recursive: true, force: true });
}
