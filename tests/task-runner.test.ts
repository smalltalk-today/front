// @vitest-environment node
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, type TestContext } from 'vitest';

const runner = fileURLToPath(new URL('../scripts/task-runner.mjs', import.meta.url));
const node = process.execPath;
const failure = [node, '-e', "console.error('DS_TOKEN_UNKNOWN: fixture.css:1'); process.exit(1)"];
const success = [node, '-e', "console.log('검증 통과')"];

async function workspace(t: TestContext) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'smalltalk-task-'));
  t.onTestFinished(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

function run(cwd: string, ...args: string[]) {
  return spawnSync(node, [runner, ...args], {
    cwd,
    encoding: 'utf8',
    timeout: 10000,
  });
}

async function state(cwd: string, id = 'card-feed') {
  return JSON.parse(await readFile(path.join(cwd, '.design-state', `${id}.json`), 'utf8'));
}

test('5회 실패를 프로세스 간 보존하고 6번째 검증과 수정 게이트를 차단한다', async (t) => {
  const cwd = await workspace(t);
  await writeFile(path.join(cwd, 'user-change.txt'), '보존할 변경');
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const result = run(cwd, 'card-feed', '--', ...failure);
    assert.equal(result.status, attempt === 5 ? 2 : 1, result.stderr);
    assert.match(result.stderr, /DS_TOKEN_UNKNOWN/);
    assert.equal((await state(cwd)).attempts.length, attempt);
  }
  const blocked = run(
    cwd,
    'card-feed',
    '--',
    node,
    '-e',
    "require('fs').writeFileSync('sixth.txt','bad')",
  );
  assert.equal(blocked.status, 2);
  assert.match(blocked.stderr, /TASK_BLOCKED/);
  await assert.rejects(readFile(path.join(cwd, 'sixth.txt')), {
    code: 'ENOENT',
  });
  assert.equal(run(cwd, '--assert-open', 'card-feed').status, 2);
  assert.equal((await state(cwd)).attempts.length, 5);
  assert.equal(await readFile(path.join(cwd, 'user-change.txt'), 'utf8'), '보존할 변경');
  const report = JSON.parse(await readFile(path.join(cwd, 'reports', 'card-feed.json'), 'utf8'));
  assert.equal(report.status, 'blocked');
  assert.equal(report.maxAttempts, 5);
  assert.match(report.attempts[4].stderr, /fixture.css:1/);
});

test('성공한 작업 ID는 완료 상태로 고정하며 새 작업에만 새 ID를 쓴다', async (t) => {
  const cwd = await workspace(t);
  assert.equal(run(cwd, '--assert-open', 'card-feed').status, 0);
  assert.equal(run(cwd, 'card-feed', '--', ...failure).status, 1);
  assert.equal(run(cwd, 'card-feed', '--', ...success).status, 0);
  assert.equal((await state(cwd)).status, 'complete');
  assert.match(run(cwd, 'card-feed', '--', ...success).stderr, /TASK_COMPLETE/);
  assert.equal((await state(cwd)).attempts.length, 2);
  assert.equal(run(cwd, 'new-task', '--', ...success).status, 0);
});

test('명시적 재개 사유가 있어야 새 회차를 열며 이전 5회 이력을 보존한다', async (t) => {
  const cwd = await workspace(t);
  for (let attempt = 0; attempt < 5; attempt += 1) run(cwd, 'card-feed', '--', ...failure);
  assert.equal(run(cwd, '--resume', 'card-feed').status, 2);
  assert.equal(run(cwd, '--resume', 'card-feed', '--reason', ' ').status, 2);
  assert.equal(
    run(cwd, '--resume', 'card-feed', '--reason', '사용자 재개 지시; 원본 토큰 확인').status,
    0,
  );
  assert.equal(run(cwd, '--assert-open', 'card-feed').status, 0);
  assert.equal(run(cwd, 'card-feed', '--', ...success).status, 0);
  const resumed = await state(cwd);
  assert.equal(resumed.round, 2);
  assert.equal(resumed.attempts.length, 6);
  assert.equal(resumed.attempts[5].number, 1);
  assert.equal(resumed.resumptions.length, 1);
});

test('잘못된 ID와 빈 명령을 거부한다', async (t) => {
  const cwd = await workspace(t);
  assert.equal(run(cwd, '../escape', '--', ...success).status, 2);
  assert.equal(run(cwd, 'card-feed', '--').status, 2);
  assert.equal(run(cwd).status, 2);
  await assert.rejects(readFile(path.join(cwd, '.design-state', 'card-feed.json')), {
    code: 'ENOENT',
  });
});

test('명령 실행 오류는 즉시 중단하고 실패 횟수를 기록한다', async (t) => {
  const cwd = await workspace(t);
  const result = run(cwd, 'card-feed', '--', 'smalltalk-command-does-not-exist');
  assert.equal(result.status, 2);
  const failed = await state(cwd);
  assert.equal(failed.status, 'blocked');
  assert.equal(failed.attempts.length, 1);
  assert.match(failed.attempts[0].error, /ENOENT/);
});

test('같은 작업의 동시 실행을 막고 SIGTERM 뒤에는 자동 수정을 중단한다', async (t) => {
  const cwd = await workspace(t);
  const child = spawn(
    node,
    [runner, 'card-feed', '--', node, '-e', "console.log('READY');setInterval(()=>{},1000)"],
    {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  t.onTestFinished(() => {
    child.kill('SIGTERM');
  });
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('실행기 시작 대기 실패')), 5000);
    child.stdout.on('data', (data) => {
      if (data.toString().includes('READY')) {
        clearTimeout(timeout);
        resolve();
      }
    });
    child.once('error', reject);
  });
  const concurrent = run(cwd, 'card-feed', '--', ...success);
  assert.equal(concurrent.status, 2);
  assert.match(concurrent.stderr, /TASK_LOCKED/);
  const closed = new Promise<number | null>((resolve) => child.once('exit', resolve));
  child.kill('SIGTERM');
  await closed;
  assert.equal((await state(cwd)).status, 'blocked');
  assert.equal((await state(cwd)).attempts.length, 1);
  assert.equal((await state(cwd)).attempts[0].signal, 'SIGTERM');
});

test('강제 종료된 실행을 복구할 때 소모한 횟수를 보존하고 재개 전 차단한다', async (t) => {
  if (process.platform === 'win32') return t.skip('POSIX SIGKILL 복구 검사');
  const cwd = await workspace(t);
  const child = spawn(
    node,
    [runner, 'card-feed', '--', node, '-e', "console.log('READY');setTimeout(()=>{},300)"],
    {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('실행기 시작 대기 실패')), 5000);
    child.stdout.on('data', (data) => {
      if (data.toString().includes('READY')) {
        clearTimeout(timeout);
        resolve();
      }
    });
    child.once('error', reject);
  });
  const closed = new Promise<number | null>((resolve) => child.once('exit', resolve));
  child.kill('SIGKILL');
  await closed;
  const gate = run(cwd, '--assert-open', 'card-feed');
  assert.equal(gate.status, 2);
  assert.match(gate.stderr, /TASK_BLOCKED/);
  const recovered = await state(cwd);
  assert.equal(recovered.attempts.length, 1);
  assert.equal(recovered.attempts[0].status, 'interrupted');
  assert.equal(recovered.status, 'blocked');
});

test('손상된 기록을 초기화하지 않고 검증 실행을 거부한다', async (t) => {
  const cwd = await workspace(t);
  run(cwd, 'card-feed', '--', ...failure);
  await writeFile(path.join(cwd, '.design-state', 'card-feed.json'), 'broken');
  assert.equal(run(cwd, 'card-feed', '--', ...success).status, 2);
  assert.equal(await readFile(path.join(cwd, '.design-state', 'card-feed.json'), 'utf8'), 'broken');
});

test('알려진 환경 비밀값은 보고서에서 가리고 작업 ID와 실패 횟수는 보존한다', async (t) => {
  const cwd = await workspace(t);
  const secret = 'synthetic-private-value-for-report';
  const result = spawnSync(
    node,
    [
      runner,
      'card-feed',
      '--',
      node,
      '-e',
      "const value=process.env.SMART_TALK_TEST_API_TOKEN;process.stdout.write(value.slice(0,8));process.stdout.write(value.slice(8));console.error('DS_TOKEN_UNKNOWN: '+value);process.exit(1)",
      secret,
    ],
    {
      cwd,
      encoding: 'utf8',
      timeout: 10000,
      env: { ...process.env, SMART_TALK_TEST_API_TOKEN: secret, SMART_TALK_TEST_PASSWORD: 'card' },
    },
  );
  assert.equal(result.status, 1);
  for (const file of ['.design-state/card-feed.json', 'reports/card-feed.json']) {
    const saved = await readFile(path.join(cwd, file), 'utf8');
    assert.equal(saved.includes(secret), false);
    assert.match(saved, /\[REDACTED\]/);
  }
  const savedState = await state(cwd);
  assert.equal(savedState.id, 'card-feed');
  assert.equal(savedState.attempts.length, 1);
  assert.equal(savedState.status, 'open');
  assert.equal(run(cwd, 'card-feed', '--', ...success).status, 0);
});

test('파싱 가능한 기록도 시도 순서나 상태가 손상되면 초기화하지 않고 거부한다', async (t) => {
  const cwd = await workspace(t);
  run(cwd, 'card-feed', '--', ...failure);
  const original = await state(cwd);
  const mutations = [
    (value: typeof original) => delete value.attempts[0].round,
    (value: typeof original) => {
      value.attempts[0].number = 0;
    },
    (value: typeof original) => {
      value.attempts[0].status = 'passed';
    },
    (value: typeof original) => {
      value.attempts[0].command = [];
    },
    (value: typeof original) => {
      value.round = 2;
    },
  ];
  for (const mutate of mutations) {
    const damaged = structuredClone(original);
    mutate(damaged);
    const contents = JSON.stringify(damaged);
    await writeFile(path.join(cwd, '.design-state/card-feed.json'), contents);
    const result = run(cwd, 'card-feed', '--', ...success);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /TASK_STATE_INVALID/);
    assert.equal(await readFile(path.join(cwd, '.design-state/card-feed.json'), 'utf8'), contents);
  }
});
