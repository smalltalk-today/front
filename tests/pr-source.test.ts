// @vitest-environment node
import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { expect, it } from 'vitest';

const execute = promisify(execFile);

it('keeps source decisions independent for PRs sharing a head SHA without posting statuses', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'smart-talk-source-test-'));
  let requests = 0;
  const server = createServer((_request, response) => {
    requests += 1;
    response.writeHead(201);
    response.end('{}');
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing test server address');
    const eventPath = join(directory, 'event.json');
    for (const [number, headRef, headRepository, passes] of [
      [1, 'dev', 'smalltalk-today/front', true],
      [2, 'feat/12-profile', 'smalltalk-today/front', false],
      [3, 'dev', 'someone/front', false],
      [1, 'dev', 'smalltalk-today/front', true],
    ] as const) {
      await writeFile(
        eventPath,
        JSON.stringify({
          pull_request: {
            number,
            base: { ref: 'main' },
            head: { ref: headRef, sha: 'a'.repeat(40), repo: { full_name: headRepository } },
          },
        }),
      );
      const result = await execute(process.execPath, ['scripts/check-pr-source.mjs'], {
        env: {
          ...process.env,
          GITHUB_EVENT_PATH: eventPath,
          GITHUB_REPOSITORY: 'smalltalk-today/front',
          GITHUB_API_URL: `http://127.0.0.1:${address.port}`,
          GH_TOKEN: 'test-token',
        },
      }).then(
        () => true,
        () => false,
      );
      expect(result).toBe(passes);
    }
    expect(requests).toBe(0);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await rm(directory, { recursive: true, force: true });
  }
});

it.each([
  ['main', 'a'.repeat(40), 'smalltalk-today/front', true],
  ['dev', 'a'.repeat(40), 'smalltalk-today/front', false],
  ['main', 'invalid', 'smalltalk-today/front', false],
  ['main', 'a'.repeat(40), '', false],
])(
  'checks %s events without a token; valid SHA/repository: %s/%s',
  async (baseRef, sha, repository, passes) => {
    const directory = await mkdtemp(join(tmpdir(), 'smart-talk-source-test-'));
    try {
      const eventPath = join(directory, 'event.json');
      await writeFile(
        eventPath,
        JSON.stringify({
          pull_request: {
            base: { ref: baseRef },
            head: { ref: 'dev', sha, repo: { full_name: 'smalltalk-today/front' } },
          },
        }),
      );
      const result = await execute(process.execPath, ['scripts/check-pr-source.mjs'], {
        env: {
          ...process.env,
          GITHUB_EVENT_PATH: eventPath,
          GITHUB_REPOSITORY: repository,
          GH_TOKEN: '',
        },
      }).then(
        () => true,
        () => false,
      );
      expect(result).toBe(passes);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  },
);
