import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { type User, type LoginRequest, type LoginResponse, type TabKey } from './types';

const TABS_BY_ROLE: Record<string, TabKey[]> = {
  owner: ['dashboard', 'chessboard', 'tasks', 'guests', 'finance', 'medical', 'sos', 'users'],
  manager: ['dashboard', 'chessboard', 'tasks', 'guests', 'finance', 'medical', 'sos', 'users'],
  doctor: ['dashboard', 'guests', 'medical', 'sos'],
  maid: ['dashboard', 'tasks', 'sos'],
  administrator: ['dashboard', 'chessboard', 'tasks', 'guests', 'finance', 'medical', 'sos', 'users'],
  receptionist: ['dashboard', 'chessboard', 'guests', 'sos'],
};

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  getVisibleTabs: () => TabKey[];
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem('pansion_token');
        const storedUser = await AsyncStorage.getItem('pansion_user');
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch {
        // ignore
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    setLoading(true);
    try {
      const res: LoginResponse = await api.post<LoginResponse>('/auth/login', credentials);
      setToken(res.token);
      setUser(res.user);
      await AsyncStorage.setItem('pansion_token', res.token);
      await AsyncStorage.setItem('pansion_user', JSON.stringify(res.user));
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem('pansion_token');
    await AsyncStorage.removeItem('pansion_user');
  }, []);

  const getVisibleTabs = useCallback((): TabKey[] => {
    if (!user) return [];
    return TABS_BY_ROLE[user.role] || ['dashboard'];
  }, [user]);

  const value = useMemo(
    () => ({ user, token, loading, login, logout, getVisibleTabs }),
    [user, token, loading, login, logout, getVisibleTabs],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
