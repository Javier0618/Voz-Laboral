import { Component, type ReactNode } from 'react';

/** Página de error útil ante fallos inesperados, sin mostrar trazas ni datos internos. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="mx-auto max-w-xl px-4 py-20">
        <h1 className="font-serif text-3xl text-ink">La página dejó de responder</h1>
        <p className="mt-3 text-slate">
          Ocurrió un error inesperado. Si estabas escribiendo una experiencia, tu borrador sigue guardado en esta pestaña.
        </p>
        <button type="button" className="btn-primary mt-6" onClick={() => window.location.reload()}>
          Recargar la página
        </button>
      </main>
    );
  }
}
