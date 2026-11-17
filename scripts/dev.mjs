import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const checker = path.join(root, 'scripts/check-design.mjs');
const next = path.join(root, 'node_modules/next/dist/bin/next');
const groups = new Set();
const posix = process.platform !== 'win32';
let stopping = false;
let shutdownTimer;
let shutdownPoll;

function isAlive(pid) {
  try {
    process.kill(posix ? -pid : pid, 0);
    return true;
  } catch (error) {
    if (error.code === 'ESRCH') return false;
    if (error.code === 'EPERM') return true;
    throw error;
  }
}

function pruneGroups() {
  for (const pid of groups) {
    if (!isAlive(pid)) groups.delete(pid);
  }
  if (stopping && groups.size === 0) {
    clearTimeout(shutdownTimer);
    clearInterval(shutdownPoll);
  }
}

function signalGroups(signal) {
  for (const pid of groups) {
    try {
      if (posix) process.kill(-pid, signal);
      else {
        // Next may own workers, so terminate the owned tree rather than its leader alone.
        const result = spawnSync(
          'taskkill',
          ['/PID', String(pid), '/T', ...(signal === 'SIGKILL' ? ['/F'] : [])],
          { stdio: 'ignore' },
        );
        if (result.error) throw result.error;
      }
    } catch (error) {
      if (error.code !== 'ESRCH') console.error(`DEV_CLEANUP_ERROR: ${error.message}`);
    }
  }
}

function stop(code, signal = 'SIGTERM') {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  signalGroups(signal);
  shutdownTimer = setTimeout(() => {
    signalGroups('SIGKILL');
    clearInterval(shutdownPoll);
  }, 5_000);
  shutdownPoll = setInterval(pruneGroups, 50);
  pruneGroups();
}

function launch(args, ipc = false) {
  const child = spawn(process.execPath, args, {
    cwd: root,
    env: process.env,
    detached: posix,
    stdio: ipc ? ['inherit', 'inherit', 'inherit', 'ipc'] : 'inherit',
  });
  if (child.pid) groups.add(child.pid);
  child.once('error', (error) => {
    console.error(`DEV_START_ERROR: ${error.message}`);
    stop(1);
  });
  child.once('close', pruneGroups);
  return child;
}

function waitForClose(child) {
  return new Promise((resolve) => child.once('close', (code, signal) => resolve({ code, signal })));
}

function waitForReady(watcher) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => finish(new Error('디자인 감시기의 준비 신호를 받지 못했습니다.')),
      30_000,
    );
    const onMessage = (message) => {
      if (message?.type === 'design-watch-ready') finish();
    };
    const onClose = () => finish(new Error('디자인 감시기가 준비되기 전에 종료됐습니다.'));
    const onError = (error) => finish(error);
    function finish(error) {
      clearTimeout(timer);
      watcher.off('message', onMessage);
      watcher.off('close', onClose);
      watcher.off('error', onError);
      if (error) reject(error);
      else resolve();
    }
    watcher.on('message', onMessage);
    watcher.once('close', onClose);
    watcher.once('error', onError);
  });
}

process.on('SIGINT', () => stop(130, 'SIGINT'));
process.on('SIGTERM', () => stop(143));

async function main() {
  const initial = await waitForClose(launch([checker]));
  if (stopping) return;
  if (initial.code !== 0) {
    console.error('디자인 검사를 통과해야 개발 서버를 시작할 수 있습니다.');
    stop(initial.code ?? 1);
    return;
  }

  const watcher = launch([checker, '--watch'], true);
  watcher.once('close', (code) => {
    if (!stopping) stop(code || 1);
  });
  await waitForReady(watcher);
  if (stopping) return;

  // Fix the directory so forwarding CLI flags cannot launch an unchecked sibling project.
  const server = launch([next, 'dev', root, ...process.argv.slice(2)]);
  server.once('close', (code) => {
    if (!stopping) stop(code ?? 1);
  });
}

main().catch((error) => {
  console.error(`DEV_GATE_ERROR: ${error.message}`);
  stop(1);
});
