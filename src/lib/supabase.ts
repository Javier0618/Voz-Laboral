import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** true cuando faltan las variables de entorno: la app lo indica en lugar de simular datos. */
export const isConfigured = Boolean(url && anonKey && !url.includes('FICTICIO'));

export const supabase: SupabaseClient | null = isConfigured
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
    })
  : null;

export function requireClient(): SupabaseClient {
  if (!supabase) throw new AppError('config', 'La conexión con la base de datos no está configurada.');
  return supabase;
}

export class AppError extends Error {
  constructor(public kind: 'config' | 'auth' | 'permission' | 'validation' | 'network' | 'not_found' | 'unknown', message: string) {
    super(message);
  }
}
