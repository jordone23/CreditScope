import type { User } from '@supabase/supabase-js';
import { createContext, useContext } from 'react';

export interface RegisterData {
  email: string;
  password: string;
  username: string;
}

export interface AuthContextValue {
  isConfigured: boolean;
  isLoading: boolean;
  isPasswordRecovery: boolean;
  resendSignupEmail: (email: string) => Promise<string | null>;
  sendPasswordRecoveryEmail: (email: string) => Promise<string | null>;
  user: User | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  signUp: (data: RegisterData) => Promise<string | null>;
  updatePassword: (password: string) => Promise<string | null>;
}

const unavailableAuthContext: AuthContextValue = {
  isConfigured: false,
  isLoading: false,
  isPasswordRecovery: false,
  resendSignupEmail: async () => 'authErrors.resendConfiguration',
  sendPasswordRecoveryEmail: async () => 'authErrors.recoveryConfiguration',
  user: null,
  signIn: async () => 'Logowanie wymaga konfiguracji Supabase.',
  signOut: async () => undefined,
  signUp: async () => 'Rejestracja wymaga konfiguracji Supabase.',
  updatePassword: async () => 'authErrors.updateConfiguration',
};

export const AuthContext = createContext<AuthContextValue>(unavailableAuthContext);

export function useAuth() {
  return useContext(AuthContext);
}
