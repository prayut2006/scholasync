import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  quickDemoLogin: (role: Role | 'principal') => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isStudent: boolean;
  isTeacher: boolean;
  isStaff: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'scholasync_user';
const TOKEN_STORAGE_KEY = 'scholasync_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const user = await api.getCurrentUser();
      setCurrentUser(user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      // If token expired or invalid, clear session
      logout();
    }
  };

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);

    if (token && saved) {
      try {
        const user = JSON.parse(saved);
        setCurrentUser(user);
        // Refresh profile in background
        api.getCurrentUser()
          .then((fresh) => {
            setCurrentUser(fresh);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fresh));
          })
          .catch(() => {
            logout();
          })
          .finally(() => {
            setIsLoading(false);
          });
        return;
      } catch (e) {
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const { user, token } = await api.login(identifier, password);
      setCurrentUser(user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } finally {
      setIsLoading(false);
    }
  };

  const quickDemoLogin = async (role: Role | 'principal') => {
    let identifier = 'principal@scholasync.in';
    let password = 'admin123';

    if (role === 'staff') {
      identifier = 'finance.staff@scholasync.in';
      password = 'staff123';
    } else if (role === 'teacher') {
      identifier = 'marcus.verma@scholasync.in';
      password = 'teacher123';
    } else if (role === 'student') {
      identifier = 'aarav.sharma@scholasync.in';
      password = 'student123';
    }

    await login(identifier, password);
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  const value: AuthContextType = {
    currentUser,
    isAuthenticated: !!currentUser,
    isLoading,
    login,
    quickDemoLogin,
    logout,
    refreshUser,
    isStudent: currentUser?.role === 'student',
    isTeacher: currentUser?.role === 'teacher',
    isStaff: currentUser?.role === 'staff',
    isAdmin: currentUser?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
