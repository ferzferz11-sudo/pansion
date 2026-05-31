import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import api from './api';
import type { User, TabVisibility, LoginRequest, LoginResponse } from './types';
import { DEFAULT_TAB_VISIBILITY } from './types';

// ── Shape ──────────────────────────────────────────────────────────────────
interface AuthContextValue {
  currentUser: User | null;
  token: string | null;
  tabVisibility: TabVisibility;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

// ── Context ────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tabVisibility, setTabVisibility] =
    useState<TabVisibility>(DEFAULT_TAB_VISIBILITY);
  const [loading, setLoading] = useState<boolean>(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('pansion_token');
    const storedUser = localStorage.getItem('pansion_user');
    if (storedToken && storedUser) {
      try {
        const parsed: User = JSON.parse(storedUser);
        setToken(storedToken);
        setCurrentUser(parsed);
      } catch {
        localStorage.removeItem('pansion_token');
        localStorage.removeItem('pansion_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    setLoading(true);
    try {
      const res: LoginResponse = await api.post<LoginResponse>(
        '/auth/login',
        credentials,
      );
      setToken(res.token);
      setCurrentUser(res.user);
      if (res.tab_visibility) {
        setTabVisibility(res.tab_visibility);
      }
      localStorage.setItem('pansion_token', res.token);
      localStorage.setItem('pansion_user', JSON.stringify(res.user));
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setCurrentUser(null);
    setTabVisibility(DEFAULT_TAB_VISIBILITY);
    localStorage.removeItem('pansion_token');
    localStorage.removeItem('pansion_user');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ currentUser, token, tabVisibility, loading, login, logout }),
    [currentUser, token, tabVisibility, loading, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}

export default AuthContext;
