import { setupWorker } from 'msw/browser';
import { createDemoHandlers } from './handlers';
const worker = setupWorker(...createDemoHandlers());
let startPromise: ReturnType<typeof worker.start> | undefined;
export function startMockWorker() {
  startPromise ??= worker.start({ onUnhandledRequest: 'bypass', quiet: true });
  return startPromise;
}
