import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { authApi, setToken, clearToken } from '@/services/api';
import { storage } from '@/utils/storage';

const TOKEN_KEY = 'zengarden_jwt_token';

interface User {
  id: string;
  address: string;
  totalFocusMinutes: number;
  totalFlowers: number;
  streakDays: number;
}

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

  // Refresh user info
  const refreshUser = useCallback(async () => {
    const token = await storage.getItem<string>(TOKEN_KEY);
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const result = await authApi.getMe();
      setUser(result.user);
    } catch {
      // Token invalid, clear local storage
      await clearToken();
      setUser(null);
    }
  }, []);

  // Restore login state on app launch
  useEffect(() => {
    refreshUser().finally(() => setIsInitialized(true));
  }, [refreshUser]);

  // Login (called after login.tsx calls verify to save token)
  const login = useCallback(async (token: string) => {
    setIsLoading(true);
    try {
      await setToken(token);
      await refreshUser();
    } finally {
      setIsLoading(false);
    }
  }, [refreshUser]);

  // Logout
  const logout = useCallback(async () => {
    await clearToken();
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
