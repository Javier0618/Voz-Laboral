import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

// Confirmaciones accesibles en lugar de alert(): región aria-live persistente.
interface ToastContextValue {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const show = useCallback((m: string) => {
    setMessage(null);
    // Reinicia el texto para que los lectores de pantalla lo anuncien de nuevo.
    requestAnimationFrame(() => setMessage(m));
  }, []);
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
        {message && (
          <div className="pointer-events-auto flex items-center gap-4 rounded-md bg-ink px-4 py-3 text-paper">
            <span>{message}</span>
            <button
              type="button"
              className="min-h-11 rounded px-2 text-paper underline"
              onClick={() => setMessage(null)}
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
