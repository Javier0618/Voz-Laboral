import { brand } from '../config/brand';

/**
 * Invitación al canal de WhatsApp. Solo aparece si existe VITE_WHATSAPP_CHANNEL_URL:
 * así el sitio no muestra un botón roto mientras el canal no exista.
 */
export function CanalWhatsApp({ className = '' }: { className?: string }) {
  if (!brand.whatsappChannel) return null;
  return (
    <aside aria-labelledby="canal-whatsapp" className={`rounded-lg border border-teal/40 bg-teal/5 p-5 sm:p-6 print:hidden ${className}`}>
      <h2 id="canal-whatsapp" className="font-sans text-lg font-semibold">Entérate primero por WhatsApp</h2>
      <p className="mt-2 max-w-prose text-slate">
        Un mensaje corto cuando hay algo que te afecta: fechas de pago que vencen, el nuevo salario mínimo o cambios en la ley. Sin cadenas ni publicidad.
      </p>
      <a href={brand.whatsappChannel} target="_blank" rel="noopener noreferrer" className="btn-primary mt-4 inline-flex">
        Seguir el canal de WhatsApp<span className="sr-only"> (se abre en otra pestaña)</span>
      </a>
    </aside>
  );
}
