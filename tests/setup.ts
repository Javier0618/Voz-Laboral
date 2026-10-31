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

  // jsdom no implementa matchMedia
  window.matchMedia ??= function (query: string) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    };
  };
}
