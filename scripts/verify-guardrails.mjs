import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const taskId = 'deliberate-design-violation';
const timeoutMs = 25_000;
const temporary = await mkdtemp(path.join(os.tmpdir(), 'smart-talk-guardrails-proof-'));
const active = new Set();
const proof = {
  version: 1,
  timezone: 'Asia/Seoul',
  startedAt: new Date().toISOString(),
  scope: '현재 앱 복사본의 실제 검사 CLI·저장 감시기·5회 작업 실행기',
  taskId,
  passed: false,
  attempts: [],
};

function launch(args) {
  const child = spawn(process.execPath, args, {
    cwd: temporary,
    shell: false,
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const listeners = new Set();
  const processState = { child, stdout: '', stderr: '', result: null };
  active.add(processState);
  const publish = () => listeners.forEach((listener) => listener());
  child.stdout.on('data', (data) => {
    processState.stdout += data.toString();
    publish();
  });
  child.stderr.on('data', (data) => {
    processState.stderr += data.toString();
    publish();
  });
  child.on('error', (error) => {
    processState.error = error.message;
    publish();
  });
  processState.closed = new Promise((resolve) =>
    child.once('close', (exitCode, signal) => {
      processState.result = {
        args,
        exitCode,
        signal,
        stdout: processState.stdout,
        stderr: processState.stderr,
        ...(processState.error ? { error: processState.error } : {}),
      };
      active.delete(processState);
      publish();
      resolve(processState.result);
    }),
  );
  processState.waitFor = (condition) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => finish(new Error('대기 중 제한 시간 초과')), timeoutMs);
      function finish(error) {
        clearTimeout(timer);
        listeners.delete(inspect);
        if (error) reject(error);
        else resolve();
      }
      function inspect() {
        if (condition(processState)) finish();
        else if (processState.result)
          finish(new Error(`예상 결과 전에 프로세스 종료: ${JSON.stringify(processState.result)}`));
      }
      listeners.add(inspect);
      inspect();
    });
  return processState;
}

async function stop(processState) {
  if (processState.result) return processState.result;
  const signal = (value) => {
    try {
      if (process.platform !== 'win32') process.kill(-processState.child.pid, value);
      else processState.child.kill(value);
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
    }
  };
  signal('SIGTERM');
  const escalation = setTimeout(() => signal('SIGKILL'), 1500);
  try {
    return await processState.closed;
  } finally {
    clearTimeout(escalation);
  }
}

async function run(args) {
  const processState = launch(args);
  const timer = setTimeout(() => {
    processState.timedOut = true;
    void stop(processState);
  }, timeoutMs);
  try {
    const result = await processState.closed;
    assert.equal(processState.timedOut, undefined, `명령 제한 시간 초과: ${JSON.stringify(args)}`);
    return result;
  } finally {
    clearTimeout(timer);
  }
}

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

let watch;
try {
  for (const name of [
    'app',
    'src',
    'design',
    'public',
    'scripts',
    'tsconfig.json',
    'package.json',
  ]) {
    await cp(path.join(root, name), path.join(temporary, name), {
      recursive: true,
    });
  }
  await symlink(path.join(root, 'node_modules'), path.join(temporary, 'node_modules'), 'dir');

  proof.baseline = await run(['scripts/check-design.mjs']);
  assert.equal(proof.baseline.exitCode, 0, proof.baseline.stderr);
  assert.match(proof.baseline.stdout, /디자인 규칙 검증 통과/);

  watch = launch(['scripts/check-design.mjs', '--watch']);
  await watch.waitFor((state) => state.stdout.includes('DS_WATCH_READY'));
  proof.watchStarted = true;
  const probeTsx = path.join(temporary, 'app/guardrails-violation-probe.tsx');
  const probeCss = path.join(temporary, 'src/guardrails-violation-probe.module.css');
  const routeDirectory = path.join(temporary, 'app/design-guardrails-probe');
  for (const file of [probeTsx, probeCss, routeDirectory]) assert.equal(await exists(file), false);
  await mkdir(routeDirectory);
  await writeFile(
    path.join(routeDirectory, 'page.tsx'),
    'export default function GuardrailsProofPage() { return <button className="bg-[#ff00ff]">미등록</button>; }\n',
  );
  await writeFile(
    probeTsx,
    'export function GuardrailsViolationProbe() { return <button className="bg-[#ff00ff]">미등록</button>; }\n',
  );
  await writeFile(probeCss, '.probe { color: #ff00ff; }\n');
  await watch.waitFor(
    (state) =>
      state.stderr.includes('DS_COMPONENT_UNKNOWN') && state.stderr.includes('DS_TOKEN_LITERAL'),
  );
  proof.watchDetected = ['DS_COMPONENT_UNKNOWN', 'DS_TOKEN_LITERAL'];

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const command = await run([
      'scripts/task-runner.mjs',
      taskId,
      '--',
      process.execPath,
      'scripts/check-design.mjs',
    ]);
    const state = JSON.parse(
      await readFile(path.join(temporary, '.design-state', `${taskId}.json`), 'utf8'),
    );
    assert.equal(command.exitCode, attempt === 5 ? 2 : 1);
    assert.equal(state.attempts.length, attempt);
    assert.equal(state.status, attempt === 5 ? 'blocked' : 'open');
    assert.equal(state.attempts.at(-1).status, 'failed');
    assert.match(command.stderr, /DS_COMPONENT_UNKNOWN/);
    assert.match(command.stderr, /DS_TOKEN_LITERAL/);
    assert.match(command.stderr, /app\/guardrails-violation-probe\.tsx/);
    assert.match(command.stderr, /app\/design-guardrails-probe\/page\.tsx/);
    proof.attempts.push({
      number: attempt,
      persistedAttemptCount: state.attempts.length,
      persistedStatus: state.status,
      command,
    });
  }

  proof.failureReport = JSON.parse(
    await readFile(path.join(temporary, 'reports', `${taskId}.json`), 'utf8'),
  );
  assert.equal(proof.failureReport.status, 'blocked');
  assert.equal(proof.failureReport.maxAttempts, 5);
  const marker = 'sixth-attempt-ran.txt';
  proof.sixthCommand = await run([
    'scripts/task-runner.mjs',
    taskId,
    '--',
    process.execPath,
    '--input-type=module',
    '-e',
    `import {writeFileSync} from "node:fs";writeFileSync("${marker}","unexpected");`,
  ]);
  assert.equal(proof.sixthCommand.exitCode, 2);
  assert.match(proof.sixthCommand.stderr, /TASK_BLOCKED/);
  proof.sixthCommandExecuted = await exists(path.join(temporary, marker));
  assert.equal(proof.sixthCommandExecuted, false, '6번째 명령이 실행되면 안 됩니다.');
  proof.assertOpen = await run(['scripts/task-runner.mjs', '--assert-open', taskId]);
  assert.equal(proof.assertOpen.exitCode, 2);
  assert.match(proof.assertOpen.stderr, /TASK_BLOCKED/);
  const afterBlocked = JSON.parse(
    await readFile(path.join(temporary, '.design-state', `${taskId}.json`), 'utf8'),
  );
  assert.equal(afterBlocked.attempts.length, 5);
  assert.equal(afterBlocked.status, 'blocked');

  const beforeRestore = watch.stdout.length;
  await rm(probeTsx);
  await rm(probeCss);
  await rm(routeDirectory, { recursive: true });
  await watch.waitFor((state) =>
    state.stdout.slice(beforeRestore).includes('디자인 규칙 검증 통과'),
  );
  proof.restoredBaseline = await run(['scripts/check-design.mjs']);
  assert.equal(proof.restoredBaseline.exitCode, 0, proof.restoredBaseline.stderr);
  proof.passed = true;
} catch (error) {
  proof.error = {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };
  process.exitCode = 1;
} finally {
  if (watch) {
    proof.watchLog = { stdout: watch.stdout, stderr: watch.stderr };
    proof.watchShutdown = await stop(watch);
  }
  for (const processState of [...active]) await stop(processState);
  await rm(temporary, { recursive: true, force: true });
  proof.cleanup = {
    activeProcesses: active.size,
    temporaryRemoved: !(await exists(temporary)),
  };
  assert.equal(proof.cleanup.activeProcesses, 0);
  assert.equal(proof.cleanup.temporaryRemoved, true);
  proof.finishedAt = new Date().toISOString();
  await mkdir(path.join(root, 'reports'), { recursive: true });
  await writeFile(
    path.join(root, 'reports/guardrails-proof.json'),
    `${JSON.stringify(proof, null, 2)}\n`,
  );
}

if (proof.passed)
  console.log('검증 훅·5회 중단·6번째 명령 차단 증명 완료: reports/guardrails-proof.json');
else console.error(`검증 장치 증명 실패: ${proof.error?.message ?? '보고서 확인'}`);
