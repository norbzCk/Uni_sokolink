import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ApiError, apiRequest } from '../api/client';

export type Role = 'CUSTOMER' | 'SELLER' | 'DELIVERY_PARTNER' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'DISABLED';
  customerCategory: 'UNKNOWN' | 'STUDENT' | 'STAFF';
  institution: string | null;
  studentRegistrationNumber: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  roles: Role[];
  createdAt: string;
}

interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: User;
}

interface RegistrationInput {
  fullName: string;
  email: string;
  phone: string;
  customerCategory: 'STUDENT' | 'STAFF';
  institution: string;
  studentRegistrationNumber?: string;
  password: string;
  passwordConfirmation: string;
}

interface RegistrationResult {
  userId: string;
  email: string;
  status: string;
  verificationEmailSent: boolean;
  phoneVerificationSent: boolean;
}

interface AuthContextValue {
  user: User | null;
  status: 'loading' | 'authenticated' | 'anonymous';
  signIn: (identifier: string, password: string) => Promise<User>;
  register: (input: RegistrationInput) => Promise<RegistrationResult>;
  signOut: () => Promise<void>;
  authRequest: <T>(path: string, init?: RequestInit) => Promise<T>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'anonymous'>('loading');
  const tokenRef = useRef<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSession = useCallback(() => {
    tokenRef.current = null;
    setUser(null);
    setStatus('anonymous');
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  }, []);

  const applySession = useCallback((session: AuthResponse) => {
    tokenRef.current = session.accessToken;
    setUser(session.user);
    setStatus('authenticated');
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
    }
    const refreshIn = Math.max(session.expiresIn - 60, 30) * 1000;
    refreshTimer.current = setTimeout(() => {
      void apiRequest<AuthResponse>('/auth/refresh', { method: 'POST' })
        .then(applySession)
        .catch(() => clearSession());
    }, refreshIn);
  }, [clearSession]);

  const refreshSession = useCallback(async () => {
    try {
      const session = await apiRequest<AuthResponse>('/auth/refresh', { method: 'POST' });
      applySession(session);
    } catch {
      clearSession();
    }
  }, [applySession, clearSession]);

  useEffect(() => {
    void refreshSession();
    return () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }
    };
    // The initial refresh must run once for the lifetime of the provider.
  }, []);

  const signIn = useCallback(async (identifier: string, password: string) => {
    const session = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    applySession(session);
    return session.user;
  }, [applySession]);

  const register = useCallback(async (input: RegistrationInput) => {
    return apiRequest<RegistrationResult>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiRequest<void>('/auth/logout', { method: 'POST' }, tokenRef.current);
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const authRequest = useCallback(async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
    try {
      return await apiRequest<T>(path, init, tokenRef.current);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        try {
          const session = await apiRequest<AuthResponse>('/auth/refresh', { method: 'POST' });
          applySession(session);
          return await apiRequest<T>(path, init, session.accessToken);
        } catch {
          clearSession();
        }
      }
      throw error;
    }
  }, [applySession, clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, signIn, register, signOut, authRequest, refreshSession }),
    [user, status, signIn, register, signOut, authRequest, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
