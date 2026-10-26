import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

// Solo en pruebas de interfaz (jsdom).
if (typeof window !== 'undefined') {
  const { cleanup } = await import('@testing-library/react');
  afterEach(() => cleanup());
  window.scrollTo = () => undefined;
  Element.prototype.scrollIntoView = () => undefined;
  // jsdom no implementa <dialog>.
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.open = false; };
}
