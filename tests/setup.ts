import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
afterEach(cleanup);
// jsdom에는 native dialog 메서드가 없어 브라우저 계약만 보완한다.
if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
}
