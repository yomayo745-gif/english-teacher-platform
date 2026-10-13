import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  isTelegram: boolean;
  initError: string | null;
  studentLogin: (login: string, password: string) => Promise<void>;
  loginAs: (role: UserRole, name?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  retryInit: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTelegram, setIsTelegram] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const initAuth = async () => {
    setIsLoading(true);
    setInitError(null);

    // Timeout safety: never hang forever
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        setIsTelegram(true);
        try {
          tg.ready();
          tg.expand();
          if (tg.setHeaderColor) tg.setHeaderColor('#ffffff');
          if (tg.setBackgroundColor) tg.setBackgroundColor('#f8fafc');
        } catch (e) {
          console.warn('Telegram WebApp methods error:', e);
        }
      }

      if (tg && tg.initData && tg.initData.length > 0) {
        // Check if telegram account is already linked
        try {
          const checkRes = await api.checkTelegram(tg.initData);
          if (checkRes.is_linked && checkRes.access_token && checkRes.user) {
            api.setToken(checkRes.access_token);
            setUser(checkRes.user);
            clearTimeout(timer);
            setIsLoading(false);
            return;
          }
        } catch (e: any) {
          console.warn('Telegram check error:', e);
        }
      }

      // Check existing token
      const token = api.getToken();
      if (token) {
        try {
          const userData = await api.getMe();
          if (userData && (userData.status === 'DISABLED' || !userData.is_active)) {
            api.setToken(null);
            setUser(null);
            setInitError('Your account has been disabled. Please contact your teacher.');
          } else {
            setUser(userData);
            clearTimeout(timer);
            setIsLoading(false);
            return;
          }
        } catch {
          api.setToken(null);
          setUser(null);
        }
      }

      // If user is accessing /admin in dev mode, default to teacher
      if (window.location.hash.startsWith('#/admin') || window.location.pathname.startsWith('/admin')) {
        try {
          const devRes = await api.devLogin('TEACHER', 'Teacher Bahrom');
          setUser(devRes.user);
        } catch {
          // Dev login disabled or failed
        }
      }
    } catch (err: any) {
      console.error('Auth initialization error:', err);
      setInitError(err.message || 'Initialization failed.');
    } finally {
      clearTimeout(timer);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const studentLogin = async (login: string, password: string) => {
    const tg = (window as any).Telegram?.WebApp;
    const tgInitData = (tg && tg.initData && tg.initData.length > 0) ? tg.initData : undefined;
    const res = await api.studentLogin(login, password, tgInitData);
    setUser(res.user);
  };

  const loginAs = async (targetRole: UserRole, name?: string) => {
    setIsLoading(true);
    try {
      const defaultName = name || (targetRole === 'STUDENT' ? 'Jasur Aliyev' : 'Teacher Bahrom');
      const res = await api.devLogin(targetRole, defaultName);
      setUser(res.user);
    } catch (err) {
      console.error('Failed to switch role:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const updated = await api.getMe();
      setUser(updated);
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isLoading,
        isTelegram,
        initError,
        studentLogin,
        loginAs,
        logout,
        refreshUser,
        retryInit: initAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
