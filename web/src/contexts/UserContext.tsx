import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { authApi, type User, setToken, clearToken, getToken } from '@/services/api';

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const result = await authApi.getMe();
      setUser(result.user);
    } catch {
      clearToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsInitialized(true));
  }, [refreshUser]);

  const login = useCallback(async (token: string) => {
    setIsLoading(true);
    try {
      setToken(token);
      await refreshUser();
    } finally {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore error, continue clearing local state
    }
    clearToken();
    setUser(null);
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoading, isInitialized, login, logout, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
