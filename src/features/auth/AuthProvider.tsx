import type { Session } from '@supabase/supabase-js';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '../../lib/supabase/client';
import { AuthContext, type AuthContextValue, type RegisterData } from './authContext';
import { normalizeUsername } from './username';

function readableAuthError(message: string, action: 'sign-in' | 'sign-up' | 'update-password') {
  if (action === 'sign-up' && /database error|unexpected_failure/i.test(message)) {
    return 'Wybrana nazwa użytkownika jest niedostępna. Wybierz inną.';
  }

  if (/invalid login credentials/i.test(message)) {
    return 'Nieprawidłowy adres e-mail lub hasło.';
  }

  if (action === 'sign-in') {
    return 'Nieprawidłowy adres e-mail lub hasło.';
  }

  if (action === 'update-password') {
    return 'Nie udało się zmienić hasła. Spróbuj ponownie za chwilę.';
  }

  return 'Nie udało się utworzyć konta. Spróbuj ponownie za chwilę.';
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
          return 'Ponowienie wiadomości wymaga konfiguracji Supabase.';
        }

        const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
        return error === null
          ? null
          : 'Nie udało się wysłać wiadomości. Spróbuj ponownie za chwilę.';
      },
      async sendPasswordRecoveryEmail(email) {
        const supabase = getSupabaseClient();
        if (supabase === null) {
          return 'Reset hasła wymaga konfiguracji Supabase.';
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        });
        return error === null
          ? null
          : 'Nie udało się wysłać wiadomości. Spróbuj ponownie za chwilę.';
      },
      user: session?.user ?? null,
      async signIn(email, password) {
        const supabase = getSupabaseClient();
        if (supabase === null) {
          return 'Logowanie wymaga konfiguracji Supabase.';
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
          return 'Rejestracja wymaga konfiguracji Supabase.';
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
          return 'Zmiana hasła wymaga konfiguracji Supabase.';
        }

        const { error } = await supabase.auth.updateUser({ password });
        return error === null ? null : readableAuthError(error.message, 'update-password');
      },
    }),
    [isLoading, isPasswordRecovery, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
