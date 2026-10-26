import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type AppRole = 'moderator' | 'admin';

export interface Profile {
  id: string;
  alias: string | null;
  deletion_requested_at: string | null;
}

interface AuthState {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isModerator: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  passwordRecovery: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(Boolean(supabase));
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  const loadProfile = useCallback(async (s: Session | null) => {
    if (!supabase || !s) {
      setProfile(null);
      setRole(null);
      return;
    }
    const [p, r] = await Promise.all([
      supabase.from('profiles').select('id, alias, deletion_requested_at').eq('id', s.user.id).maybeSingle(),
      supabase.from('admin_roles').select('role').eq('user_id', s.user.id).maybeSingle(),
    ]);
    setProfile((p.data as Profile | null) ?? null);
    // El rol solo decide qué enlaces se muestran. La base de datos impone los permisos.
    setRole(((r.data as { role: AppRole } | null)?.role) ?? null);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadProfile(data.session);
      if (active) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      if (event === 'SIGNED_OUT') setPasswordRecovery(false);
      // Diferido para no llamar a Supabase dentro del callback de auth.
      setTimeout(() => void loadProfile(s), 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      session,
      profile,
      role,
      isModerator: role === 'moderator' || role === 'admin',
      passwordRecovery,
      refreshProfile: () => loadProfile(session),
      signOut: async () => {
        await supabase?.auth.signOut();
      },
    }),
    [loading, session, profile, role, passwordRecovery, loadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
