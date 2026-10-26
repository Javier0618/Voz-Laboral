import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getMyProfile, getMyRoles, type Profile } from '../lib/api';

interface AuthState {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  roles: ('moderator' | 'admin')[];
  isModerator: boolean;
  isAdmin: boolean;
  /** true tras abrir el enlace de recuperación de contraseña. */
  recovering: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(Boolean(supabase));
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<('moderator' | 'admin')[]>([]);
  const [recovering, setRecovering] = useState(false);

  const loadAccount = useCallback(async (s: Session | null) => {
    if (!s) {
      setProfile(null);
      setRoles([]);
      return;
    }
    try {
      const [p, r] = await Promise.all([getMyProfile(s.user.id), getMyRoles(s.user.id)]);
      setProfile(p);
      setRoles(r);
    } catch {
      setProfile(null);
      setRoles([]);
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadAccount(data.session);
      if (active) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      // Diferido para no llamar a Supabase dentro del propio callback.
      setTimeout(() => void loadAccount(s), 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadAccount]);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      session,
      profile,
      roles,
      isModerator: roles.includes('moderator') || roles.includes('admin'),
      isAdmin: roles.includes('admin'),
      recovering,
      refreshProfile: () => loadAccount(session),
      signOut: async () => {
        await supabase?.auth.signOut();
        setRecovering(false);
      },
    }),
    [loading, session, profile, roles, recovering, loadAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
