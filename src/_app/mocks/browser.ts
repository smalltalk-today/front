import { setupWorker } from 'msw/browser';
import { createMockHandlers } from './handlers';
const worker = setupWorker(...createMockHandlers());
let startPromise: ReturnType<typeof worker.start> | undefined;
export function startMockWorker() {
  startPromise ??= worker
    .start({ onUnhandledRequest: 'bypass', quiet: true })
    .catch((error: unknown) => {
      startPromise = undefined;
      throw error;
    });
  return startPromise;
}
