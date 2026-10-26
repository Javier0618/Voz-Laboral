import type { ReactNode } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import { ConfigNotice } from './ConfigNotice';

export function SupabaseGate({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured) return <div className="py-6"><ConfigNotice /></div>;
  return <>{children}</>;
}
