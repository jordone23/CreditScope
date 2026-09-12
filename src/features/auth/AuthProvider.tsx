import type { Session } from '@supabase/supabase-js';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '../../lib/supabase/client';
import { AuthContext, type AuthContextValue, type RegisterData } from './authContext';
import { normalizeUsername } from './username';

function readableAuthError(message: string, action: 'sign-in' | 'sign-up' | 'update-password') {
  if (action === 'sign-up' && /database error|unexpected_failure/i.test(message)) {
    return 'authErrors.usernameUnavailable';
  }

  if (/invalid login credentials/i.test(message)) {
    return 'authErrors.invalidCredentials';
  }

  if (action === 'sign-in') {
    return 'authErrors.invalidCredentials';
  }

  if (action === 'update-password') {
    return 'authErrors.updatePassword';
  }

  return 'authErrors.signUp';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured());
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (supabase === null) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session);
        setIsLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setIsPasswordRecovery(event === 'PASSWORD_RECOVERY');
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isConfigured: isSupabaseConfigured(),
      isLoading,
      isPasswordRecovery,
      async resendSignupEmail(email) {
        const supabase = getSupabaseClient();
        if (supabase === null) {
          return 'authErrors.resendConfiguration';
        }

        const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
        return error === null ? null : 'authErrors.send';
      },
      async sendPasswordRecoveryEmail(email) {
        const supabase = getSupabaseClient();
        if (supabase === null) {
          return 'authErrors.recoveryConfiguration';
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        });
        return error === null ? null : 'authErrors.send';
      },
      user: session?.user ?? null,
      async signIn(email, password) {
        const supabase = getSupabaseClient();
        if (supabase === null) {
          return 'authErrors.signInConfiguration';
        }

        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        return error === null ? null : readableAuthError(error.message, 'sign-in');
      },
      async signOut() {
        const supabase = getSupabaseClient();
        if (supabase !== null) {
          await supabase.auth.signOut();
        }
      },
      async signUp({ email, password, username }: RegisterData) {
        const supabase = getSupabaseClient();
        if (supabase === null) {
          return 'authErrors.signUpConfiguration';
        }

        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { username: normalizeUsername(username) } },
        });
        return error === null ? null : readableAuthError(error.message, 'sign-up');
      },
      async updatePassword(password) {
        const supabase = getSupabaseClient();
        if (supabase === null) {
          return 'authErrors.updateConfiguration';
        }

        const { error } = await supabase.auth.updateUser({ password });
        return error === null ? null : readableAuthError(error.message, 'update-password');
      },
    }),
    [isLoading, isPasswordRecovery, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
