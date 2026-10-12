// @vitest-environment node
import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { expect, it } from 'vitest';

const execute = promisify(execFile);

it.each([
  ['dev', 'smalltalk-today/front', 201, 'success', true],
  ['feat/12-profile', 'smalltalk-today/front', 201, 'failure', false],
  ['dev', 'someone/front', 201, 'failure', false],
  ['dev', 'smalltalk-today/front', 403, 'success', false],
])(
  'posts main-source for %s from %s; API %i',
  async (headRef, headRepository, status, state, passes) => {
    const directory = await mkdtemp(join(tmpdir(), 'smart-talk-source-test-'));
    const sha = 'a'.repeat(40);
    let received: { path?: string; body?: { state: string; context: string } } = {};
    const server = createServer(async (request, response) => {
      let body = '';
      for await (const chunk of request) body += chunk;
      received = { path: request.url, body: JSON.parse(body) };
      response.writeHead(status, { 'Content-Type': 'application/json' });
      response.end('{}');
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('Missing test server address');
      const eventPath = join(directory, 'event.json');
      await writeFile(
        eventPath,
        JSON.stringify({
          pull_request: {
            base: { ref: 'main' },
            head: { ref: headRef, sha, repo: { full_name: headRepository } },
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
      expect(received.path).toBe(`/repos/smalltalk-today/front/statuses/${sha}`);
      expect(received.body).toMatchObject({ state, context: 'main-source' });
      expect(result).toBe(passes);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      await rm(directory, { recursive: true, force: true });
    }
  },
);
