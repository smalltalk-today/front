// @vitest-environment node
import { spawn, type ChildProcess } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

type Event = {
  kind: string;
  pid: number;
  args?: string[];
  port?: string;
  marker?: string;
  readyObserved?: boolean;
};
type Result = { code: number | null; signal: NodeJS.Signals | null };
type Fixture = {
  root: string;
  child: ChildProcess;
  events: () => Promise<Event[]>;
  output: () => string;
  closed: () => Promise<Result>;
  event: (kind: string) => Promise<Event>;
};
const fixtures: Fixture[] = [];

const fakeChecker = `
import fs from 'node:fs';
import path from 'node:path';
const event = (kind) => fs.appendFileSync(process.env.TEST_EVENTS, JSON.stringify({kind,pid:process.pid})+'\\n');
const marker = (name) => path.join(process.cwd(), name);
if (!process.argv.includes('--watch')) {
  event('initial');
  if (process.env.TEST_INITIAL_WAIT !== '1') process.exit(Number(process.env.TEST_INITIAL_CODE ?? 0));
} else {
  event('watch-start');
  if (process.env.TEST_WATCH_EARLY_EXIT === '1') process.exit(0);
  setTimeout(() => {
    fs.writeFileSync(marker('watch-ready'), 'ready');
    event('watch-ready');
    process.send?.({type:'design-watch-ready'});
  }, 40);
  if (process.env.TEST_WATCH_LATE_EXIT === '1') setInterval(() => {
    if (fs.existsSync(marker('next-started'))) process.exit(1);
  }, 10);
}
process.on('SIGTERM', () => {
  event(process.env.TEST_STUBBORN_WATCH === '1' ? 'watch-ignored' : 'checker-stop');
  if (process.env.TEST_STUBBORN_WATCH !== '1') process.exit(0);
});
process.on('SIGINT', () => { event('checker-interrupted'); process.exit(0); });
setInterval(() => {}, 1000);
`;

const fakeNext = `
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const event = (kind, extra={}) => fs.appendFileSync(process.env.TEST_EVENTS, JSON.stringify({kind,pid:process.pid,...extra})+'\\n');
event('next-start', {args:process.argv.slice(2),port:process.env.PORT,marker:process.env.TEST_MARKER,readyObserved:fs.existsSync(path.join(process.cwd(),'watch-ready'))});
fs.writeFileSync(path.join(process.cwd(),'next-started'),'ready');
if (process.env.TEST_NEXT_WORKER === '1') spawn(process.execPath, ['-e', \
  "const fs=require('node:fs');const event=kind=>fs.appendFileSync(process.env.TEST_EVENTS,JSON.stringify({kind,pid:process.pid})+'\\\\n');event('worker-start');process.on('SIGTERM',()=>{event('worker-stop');process.exit(0)});setInterval(()=>{},1000)"\
], {stdio:'inherit'});
process.on('SIGTERM', () => { event('next-stop'); process.exit(0); });
process.on('SIGINT', () => { event('next-interrupted'); process.exit(0); });
if (process.env.TEST_NEXT_EXIT === '1') setTimeout(() => process.exit(0), 50);
setInterval(() => {}, 1000);
`;

function alive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ESRCH') return false;
    throw error;
  }
}

async function waitUntil<T>(read: () => Promise<T | undefined>, timeout = 7_000): Promise<T> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await read();
    if (value !== undefined) return value;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error('개발 실행기의 예상 상태를 기다리는 중 제한 시간 초과');
}

async function fixture(env: Record<string, string> = {}, args: string[] = []): Promise<Fixture> {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'smart-talk-dev-gate-')));
  const eventsFile = path.join(root, 'events.jsonl');
  await mkdir(path.join(root, 'scripts'), { recursive: true });
  await mkdir(path.join(root, 'node_modules/next/dist/bin'), { recursive: true });
  await cp(new URL('../scripts/dev.mjs', import.meta.url), path.join(root, 'scripts/dev.mjs'));
  await writeFile(path.join(root, 'scripts/check-design.mjs'), fakeChecker);
  await writeFile(path.join(root, 'node_modules/next/dist/bin/next'), fakeNext);
  await writeFile(eventsFile, '');
  const child = spawn(process.execPath, ['scripts/dev.mjs', ...args], {
    cwd: root,
    env: { ...process.env, TEST_EVENTS: eventsFile, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let result: Result | undefined;
  let output = '';
  child.stdout.on('data', (data) => (output += data.toString()));
  child.stderr.on('data', (data) => (output += data.toString()));
  child.once('close', (code, signal) => {
    result = { code, signal };
  });
  const readEvents = async (): Promise<Event[]> =>
    (await readFile(eventsFile, 'utf8'))
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Event);
  const value = {
    root,
    child,
    events: readEvents,
    output: () => output,
    closed: () => waitUntil(async () => result),
    event: (kind: string) =>
      waitUntil(async () => (await readEvents()).find((e) => e.kind === kind)),
  };
  fixtures.push(value);
  return value;
}

afterEach(async () => {
  for (const fixture of fixtures.splice(0)) {
    if (fixture.child.exitCode === null && fixture.child.signalCode === null) {
      fixture.child.kill('SIGTERM');
    }
    try {
      await fixture.closed();
    } finally {
      for (const event of await fixture.events()) {
        if (alive(event.pid)) process.kill(event.pid, 'SIGKILL');
      }
      await rm(fixture.root, { recursive: true, force: true });
    }
  }
});

describe('개발 서버 디자인 게이트', () => {
  it('초기 위반이면 감시기와 Next를 실행하지 않는다', async () => {
    const f = await fixture({ TEST_INITIAL_CODE: '1' });
    expect(await f.closed()).toEqual({ code: 1, signal: null });
    expect((await f.events()).map((e) => e.kind)).toEqual(['initial']);
    expect(f.output()).toContain('디자인 검사를 통과해야');
  });

  it('감시기 준비 전에 종료되면 Next를 실행하지 않는다', async () => {
    const f = await fixture({ TEST_WATCH_EARLY_EXIT: '1' });
    expect(await f.closed()).toEqual({ code: 1, signal: null });
    expect((await f.events()).some((e) => e.kind === 'next-start')).toBe(false);
  });

  it('감시 준비 후 현재 프로젝트에서 CLI 인수와 환경을 그대로 전달한다', async () => {
    const f = await fixture({ PORT: '3240', TEST_MARKER: 'preserved', TEST_NEXT_WORKER: '1' }, [
      '--port',
      '3241',
      '--hostname',
      '127.0.0.1',
      '--webpack',
    ]);
    const next = await f.event('next-start');
    const worker = await f.event('worker-start');
    expect(next.args).toEqual([
      'dev',
      f.root + path.sep,
      '--port',
      '3241',
      '--hostname',
      '127.0.0.1',
      '--webpack',
    ]);
    expect(next).toMatchObject({ readyObserved: true, port: '3240', marker: 'preserved' });
    f.child.kill('SIGTERM');
    expect(await f.closed()).toEqual({ code: 143, signal: null });
    expect((await f.events()).map((e) => e.kind)).toContain('worker-stop');
    await waitUntil(async () => (!alive(worker.pid) ? true : undefined));
    expect(alive(next.pid)).toBe(false);
  });

  it('운영 중 감시기가 종료되면 Next도 종료하고 실패를 반환한다', async () => {
    const f = await fixture({ TEST_WATCH_LATE_EXIT: '1' });
    const next = await f.event('next-start');
    expect(await f.closed()).toEqual({ code: 1, signal: null });
    expect(alive(next.pid)).toBe(false);
  });

  it('Next가 정상 종료되면 감시기를 정리하고 같은 종료 코드를 반환한다', async () => {
    const f = await fixture({ TEST_NEXT_EXIT: '1' });
    const watch = await f.event('watch-start');
    expect(await f.closed()).toEqual({ code: 0, signal: null });
    expect(alive(watch.pid)).toBe(false);
  });

  it('초기 검사 중 SIGINT도 검사 프로세스를 정리한다', async () => {
    const f = await fixture({ TEST_INITIAL_WAIT: '1' });
    const initial = await f.event('initial');
    f.child.kill('SIGINT');
    expect(await f.closed()).toEqual({ code: 130, signal: null });
    expect(alive(initial.pid)).toBe(false);
    expect((await f.events()).some((e) => e.kind === 'next-start')).toBe(false);
  });

  it('종료 신호를 무시하는 감시기는 5초 유예 후 강제 종료한다', async () => {
    const f = await fixture({ TEST_STUBBORN_WATCH: '1' });
    await f.event('next-start');
    const watch = await f.event('watch-start');
    f.child.kill('SIGTERM');
    await f.event('watch-ignored');
    expect(await f.closed()).toEqual({ code: 143, signal: null });
    expect(alive(watch.pid)).toBe(false);
  }, 10_000);
});
