export function ConfigNotice() {
  return (
    <div role="alert" className="rounded-md border border-l-4 border-warning/50 bg-paper p-5">
      <h2 className="text-2xl">Falta configurar la conexión con Supabase</h2>
      <p className="mt-2 max-w-prose text-ink">
        Esta sección necesita la base de datos. Define <code>VITE_SUPABASE_URL</code> y{' '}
        <code>VITE_SUPABASE_ANON_KEY</code> en un archivo <code>.env.local</code> (usa{' '}
        <code>.env.example</code> como plantilla) y reinicia el servidor. No se muestran datos de ejemplo.
      </p>
    </div>
  );
}
