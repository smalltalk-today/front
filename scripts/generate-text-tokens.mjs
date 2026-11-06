import { spawn } from 'node:child_process';
import { readFileSync, watchFile, writeFileSync, unwatchFile } from 'node:fs';
import { createRequire } from 'node:module';
import postcss from 'postcss';

const source = new URL('../src/_app/styles/typography.css', import.meta.url);
const output = new URL('../src/shared/lib/text-tokens.generated.json', import.meta.url);

function generate() {
  const tokens = new Set();

  postcss.parse(readFileSync(source, 'utf8')).walkDecls(/^--text-/, ({ prop }) => {
    const name = prop.slice('--text-'.length);
    if (name && !name.includes('--')) tokens.add(name);
  });

  const json = `${JSON.stringify([...tokens], null, 2)}\n`;
  let previous;
  try {
    previous = readFileSync(output, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (previous !== json) writeFileSync(output, json);
}

generate();

if (process.argv[2] === '--dev') {
  // watchFile은 편집기의 파일 교체 저장 후에도 감시를 유지한다.
  watchFile(source, { interval: 200 }, () => {
    try {
      generate();
    } catch (error) {
      console.error('[text-tokens] JSON 갱신 실패:', error.message);
    }
  });

  const require = createRequire(import.meta.url);
  const next = spawn(
    process.execPath,
    [require.resolve('next/dist/bin/next'), 'dev', ...process.argv.slice(3)],
    {
      stdio: 'inherit',
    },
  );
  const stop = (signal) => {
    unwatchFile(source);
    next.kill(signal);
  };
  process.on('SIGINT', () => stop('SIGINT'));
  process.on('SIGTERM', () => stop('SIGTERM'));
  next.on('error', (error) => {
    console.error(error);
    unwatchFile(source);
    process.exitCode = 1;
  });
  next.on('exit', (code, signal) => {
    unwatchFile(source);
    process.exitCode = code ?? (signal === 'SIGINT' || signal === 'SIGTERM' ? 0 : 1);
  });
}
