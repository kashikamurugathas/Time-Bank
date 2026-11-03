import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types/index.ts';
import { api, getStoredToken, setStoredToken, removeStoredToken } from '../services/api.ts';
import { joinUserRoom } from '../services/socket.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string, rememberMe?: boolean) => Promise<{ success: boolean; requiresPasswordChange?: boolean }>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  showRegisterModal: boolean;
  setShowRegisterModal: (show: boolean) => void;
  showChangePasswordModal: boolean;
  setShowChangePasswordModal: (show: boolean) => void;
  quickLoginAs: (email: string, pass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [loading, setLoading] = useState<boolean>(true);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);

  const refreshProfile = useCallback(async () => {
    try {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return;
      }
      const data = await api.getProfile();
      if (data) {
        setUser(data);
        joinUserRoom(data.id);
        if (data.requires_password_change) {
          setShowChangePasswordModal(true);
        }
      }
    } catch (err) {
      console.warn('Session expired or invalid:', err);
      removeStoredToken();
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (email: string, pass: string, rememberMe = false) => {
    const res = await api.login({ email, password: pass, rememberMe });
    if (res.token) {
      setStoredToken(res.token);
      setToken(res.token);
      await refreshProfile();
      if (res.user?.requiresPasswordChange) {
        setShowChangePasswordModal(true);
      }
      return { success: true, requiresPasswordChange: res.user?.requiresPasswordChange };
    }
    return { success: false };
  };

  const register = async (data: any) => {
    return await api.register(data);
  };

  const logout = () => {
    removeStoredToken();
    setToken(null);
    setUser(null);
  };

  const quickLoginAs = async (email: string, pass: string) => {
    await login(email, pass, true);
    setShowLoginModal(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshProfile,
        showLoginModal,
        setShowLoginModal,
        showRegisterModal,
        setShowRegisterModal,
        showChangePasswordModal,
        setShowChangePasswordModal,
        quickLoginAs
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
