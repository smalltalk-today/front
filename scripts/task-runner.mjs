import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, open, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

const MAX_ATTEMPTS = 5;
const OUTPUT_LIMIT = 64 * 1024;
const [mode, ...args] = process.argv.slice(2);
const root = process.cwd();
const secrets = Object.entries(process.env)
  .filter(
    ([name, value]) =>
      /TOKEN|SECRET|PASSWORD|PASSWD|PRIVATE_KEY|API_KEY|AUTHORIZATION|COOKIE/i.test(name) && value,
  )
  .map(([, value]) => value)
  .sort((a, b) => b.length - a.length);

function redact(value) {
  if (typeof value !== 'string') return value;
  for (const secret of secrets) value = value.replaceAll(secret, '[REDACTED]');
  return value;
}

function reportValue(key, value) {
  if (key === 'command' && Array.isArray(value)) return value.map(redact);
  return ['stdout', 'stderr', 'error', 'reason'].includes(key) ? redact(value) : value;
}

function fail(message) {
  throw new Error(message);
}

function taskId(value) {
  if (!value || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(value)) {
    fail('TASK_ID_INVALID: 작업 ID는 영문·숫자로 시작하는 80자 이하 영문·숫자·._-만 가능합니다.');
  }
  return value;
}

function isAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) fail('TASK_LOCK_INVALID: 잠금 파일을 확인하세요.');
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === 'ESRCH') return false;
    if (error.code === 'EPERM') return true;
    throw error;
  }
}

function assertState(state, id) {
  const invalid = () => fail('TASK_STATE_INVALID: 기존 기록을 보존하고 상태 파일을 확인하세요.');
  if (
    state?.version !== 1 ||
    state.id !== id ||
    !Number.isInteger(state.round) ||
    state.round < 1 ||
    !['open', 'running', 'blocked', 'complete'].includes(state.status) ||
    !Array.isArray(state.attempts) ||
    !Array.isArray(state.resumptions) ||
    state.resumptions.length !== state.round - 1
  )
    invalid();
  const rounds = new Map();
  let previousRound = 1;
  for (const attempt of state.attempts) {
    if (
      !attempt ||
      !Number.isInteger(attempt.round) ||
      attempt.round < previousRound ||
      attempt.round > state.round ||
      !Number.isInteger(attempt.number) ||
      !['running', 'failed', 'passed', 'interrupted'].includes(attempt.status) ||
      typeof attempt.startedAt !== 'string' ||
      !Array.isArray(attempt.command) ||
      !attempt.command[0] ||
      attempt.command.some((argument) => typeof argument !== 'string') ||
      typeof attempt.stdout !== 'string' ||
      typeof attempt.stderr !== 'string'
    )
      invalid();
    const attempts = rounds.get(attempt.round) ?? [];
    if (attempt.number !== attempts.length + 1 || attempt.number > MAX_ATTEMPTS) invalid();
    attempts.push(attempt);
    rounds.set(attempt.round, attempts);
    previousRound = attempt.round;
  }
  for (const [index, resumption] of state.resumptions.entries()) {
    const previous = rounds.get(index + 1);
    if (
      resumption?.round !== index + 1 ||
      typeof resumption.at !== 'string' ||
      typeof resumption.reason !== 'string' ||
      !resumption.reason.trim() ||
      !previous?.length ||
      !(
        previous.at(-1).status === 'interrupted' ||
        (previous.length === MAX_ATTEMPTS && previous.at(-1).status === 'failed')
      )
    )
      invalid();
  }
  const current = rounds.get(state.round) ?? [];
  const last = current.at(-1);
  if (
    (state.status === 'running' && last?.status !== 'running') ||
    (state.status === 'complete' && last?.status !== 'passed') ||
    (state.status === 'open' &&
      current.length > 0 &&
      (last.status !== 'failed' || current.length >= MAX_ATTEMPTS)) ||
    (state.status === 'blocked' &&
      !(
        last?.status === 'interrupted' ||
        (current.length === MAX_ATTEMPTS && last?.status === 'failed')
      )) ||
    state.attempts.some(
      (attempt) => attempt !== last && ['running', 'passed'].includes(attempt.status),
    )
  )
    invalid();
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

async function atomicJson(file, value) {
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(value, reportValue, 2)}\n`, {
      mode: 0o600,
    });
    await rename(temporary, file);
  } finally {
    await unlink(temporary).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
  }
}

async function withTask(id, action) {
  const stateDirectory = path.join(root, '.design-state');
  await mkdir(stateDirectory, { recursive: true });
  const lockFile = path.join(stateDirectory, `${id}.lock`);
  const recoveryFile = `${lockFile}.recovery`;
  const stateFile = path.join(stateDirectory, `${id}.json`);
  let lock;
  try {
    lock = await open(lockFile, 'wx', 0o600);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const owner = await readJson(lockFile);
    if (!owner || isAlive(owner.pid)) fail(`TASK_LOCKED: ${id} 작업이 실행 중입니다.`);
    // A separate recovery lock prevents two restarted runners from deleting a new lock.
    const recovery = await open(recoveryFile, 'wx', 0o600).catch(() =>
      fail(`TASK_LOCKED: ${id} 작업의 중단 상태를 복구 중입니다.`),
    );
    try {
      const current = await readJson(lockFile);
      if (current && isAlive(current.pid)) fail(`TASK_LOCKED: ${id} 작업이 실행 중입니다.`);
      if (current) await unlink(lockFile);
      lock = await open(lockFile, 'wx', 0o600);
    } finally {
      await recovery.close();
      await unlink(recoveryFile);
    }
  }

  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() }));
    const state = await readJson(stateFile, {
      version: 1,
      id,
      round: 1,
      status: 'open',
      attempts: [],
      resumptions: [],
    });
    assertState(state, id);

    const save = () => atomicJson(stateFile, state);
    const report = async () => {
      const directory = path.join(root, 'reports');
      await mkdir(directory, { recursive: true });
      await atomicJson(path.join(directory, `${id}.json`), {
        ...state,
        maxAttempts: MAX_ATTEMPTS,
        nextAction:
          state.status === 'blocked'
            ? '자동 수정을 중단했습니다. 기록된 원인을 해결하고 사용자 재개 지시를 받은 뒤 --resume을 실행하세요.'
            : state.status === 'complete'
              ? '검증을 통과해 작업을 완료했습니다. 별도 작업에는 새 ID를 사용하세요.'
              : '현재 오류를 수정한 뒤 같은 작업 ID로 검증하세요.',
      });
    };
    if (state.status === 'running') {
      state.status = 'blocked';
      const attempt = state.attempts.at(-1);
      if (attempt?.status === 'running') {
        attempt.status = 'interrupted';
        attempt.finishedAt = new Date().toISOString();
        attempt.error = '이전 실행이 검증 완료를 기록하지 못했습니다.';
      }
      await save();
      await report();
    }
    const lastAttempt = state.attempts.at(-1);
    if (
      lastAttempt?.status === 'interrupted' &&
      lastAttempt.childPid &&
      isAlive(lastAttempt.childPid)
    ) {
      fail('TASK_BLOCKED: 이전 검증 자식 프로세스가 아직 실행 중입니다. 종료된 뒤 재개하세요.');
    }
    return await action(state, save, report);
  } finally {
    await lock.close();
    await unlink(lockFile);
  }
}

function assertOpen(state) {
  if (state.status === 'complete') {
    fail(
      'TASK_COMPLETE: 완료된 작업 ID는 다시 실행하지 않습니다. 별도 작업에는 새 ID를 사용하세요.',
    );
  }
  if (state.status !== 'open') {
    fail('TASK_BLOCKED: 자동 수정·검증을 중단했습니다. 원인 해결과 사용자 재개 지시가 필요합니다.');
  }
  if (state.attempts.filter((attempt) => attempt.round === state.round).length >= MAX_ATTEMPTS) {
    fail('TASK_BLOCKED: 이번 회차의 최대 5회를 사용했습니다.');
  }
}

async function validate(state, save, report, command) {
  assertOpen(state);
  const attempt = {
    round: state.round,
    number: state.attempts.filter((item) => item.round === state.round).length + 1,
    startedAt: new Date().toISOString(),
    command,
    status: 'running',
    stdout: '',
    stderr: '',
  };
  state.attempts.push(attempt);
  state.status = 'running';
  await save();
  console.log(`TASK_ATTEMPT: ${state.id} ${attempt.number}/${MAX_ATTEMPTS} (회차 ${state.round})`);

  const child = spawn(command[0], command.slice(1), {
    cwd: root,
    shell: false,
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let interrupted;
  let escalation;
  const terminate = (signal) => {
    interrupted ||= signal;
    const kill = (value) => {
      try {
        if (child.pid && process.platform !== 'win32') process.kill(-child.pid, value);
        else child.kill(value);
      } catch (error) {
        if (error.code !== 'ESRCH') attempt.error = error.message;
      }
    };
    kill(signal);
    escalation ||= setTimeout(() => kill('SIGKILL'), 1000);
    escalation.unref();
  };
  const onInterrupt = () => terminate('SIGINT');
  const onTerminate = () => terminate('SIGTERM');
  process.on('SIGINT', onInterrupt);
  process.on('SIGTERM', onTerminate);
  child.stdout.on('data', (data) => {
    process.stdout.write(data);
    attempt.stdout = (attempt.stdout + data.toString()).slice(-OUTPUT_LIMIT);
  });
  child.stderr.on('data', (data) => {
    process.stderr.write(data);
    attempt.stderr = (attempt.stderr + data.toString()).slice(-OUTPUT_LIMIT);
  });
  child.on('error', (error) => {
    attempt.error = error.message;
  });
  const closed = new Promise((resolve) => {
    child.once('close', (code, signal) => resolve({ code, signal }));
  });
  if (child.pid) {
    attempt.childPid = child.pid;
    await save();
  }
  const result = await closed;
  clearTimeout(escalation);
  process.off('SIGINT', onInterrupt);
  process.off('SIGTERM', onTerminate);
  attempt.finishedAt = new Date().toISOString();
  attempt.exitCode = result.code;
  attempt.signal = result.signal || interrupted || null;
  const passed = result.code === 0 && !interrupted && !attempt.error;
  attempt.status = passed
    ? 'passed'
    : interrupted || attempt.error || result.signal
      ? 'interrupted'
      : 'failed';
  state.status = passed
    ? 'complete'
    : attempt.status === 'interrupted' || attempt.number >= MAX_ATTEMPTS
      ? 'blocked'
      : 'open';
  await save();
  await report();
  console.log(`TASK_${state.status.toUpperCase()}: ${state.id}`);
  if (state.status === 'blocked') console.error(`자동 수정 중단. reports/${state.id}.json 확인.`);
  return passed ? 0 : state.status === 'blocked' ? 2 : 1;
}

try {
  let exitCode;
  if (mode === '--assert-open') {
    if (args.length !== 1) fail('사용법: task-runner.mjs --assert-open <task-id>');
    exitCode = await withTask(taskId(args[0]), async (state) => {
      assertOpen(state);
      console.log(`TASK_OPEN: ${state.id}`);
      return 0;
    });
  } else if (mode === '--resume') {
    if (args.length !== 3 || args[1] !== '--reason' || !args[2].trim()) {
      fail('사용법: task-runner.mjs --resume <task-id> --reason <사용자 재개 지시와 해결 내용>');
    }
    exitCode = await withTask(taskId(args[0]), async (state, save, report) => {
      if (state.status !== 'blocked') fail('TASK_NOT_BLOCKED: 중단된 작업만 재개할 수 있습니다.');
      state.resumptions.push({
        round: state.round,
        at: new Date().toISOString(),
        reason: args[2],
      });
      state.round += 1;
      state.status = 'open';
      await save();
      await report();
      console.log(`TASK_RESUMED: ${state.id} (회차 ${state.round})`);
      return 0;
    });
  } else {
    const id = taskId(mode);
    if (args[0] !== '--' || args.length < 2 || !args[1]) {
      fail('사용법: task-runner.mjs <task-id> -- <검증 명령> [인수...]');
    }
    exitCode = await withTask(id, (state, save, report) =>
      validate(state, save, report, args.slice(1)),
    );
  }
  process.exitCode = exitCode;
} catch (error) {
  console.error(`TASK_RUNNER_ERROR: ${error.message}`);
  process.exitCode = 2;
}
