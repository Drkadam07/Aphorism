import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, RegisterPayload, VerifyOtpPayload, ResendOtpPayload, LoginPayload, UpdateProfilePayload } from '../types/index.ts';
import { api, getStoredToken, setStoredToken } from '../services/api.ts';

export type AuthModalView = 'login' | 'register' | 'verify-otp';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pendingEmail: string;
  authModalOpen: boolean;
  authModalView: AuthModalView;
  lastDispatchedOtp: string | null;
  openAuthModal: (view?: AuthModalView, email?: string) => void;
  closeAuthModal: () => void;
  setPendingEmail: (email: string) => void;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<{ message: string; otp?: string }>;
  verifyOtp: (payload: VerifyOtpPayload) => Promise<void>;
  resendOtp: (payload: ResendOtpPayload) => Promise<{ message: string; otp?: string }>;
  logout: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<User>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<AuthModalView>('login');
  const [pendingEmail, setPendingEmail] = useState('');
  const [lastDispatchedOtp, setLastDispatchedOtp] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const me = await api.getMe();
      setUser(me);
    } catch {
      // If token invalid, clear
      setStoredToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      // Default to initial token for seamless inspection of live feed
      const demoToken = 'mock_jwt_token_1';
      setStoredToken(demoToken);
    }
    refreshUser();

    const handleUnauthorized = () => {
      setUser(null);
      setStoredToken(null);
      setAuthModalView('login');
      setAuthModalOpen(true);
    };

    window.addEventListener('aphorism:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('aphorism:unauthorized', handleUnauthorized);
    };
  }, [refreshUser]);

  const openAuthModal = (view: AuthModalView = 'login', email?: string) => {
    setAuthModalView(view);
    if (email) setPendingEmail(email);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const login = async (payload: LoginPayload) => {
    const res = await api.login(payload);
    setStoredToken(res.access_token);
    if (res.user) {
      setUser(res.user);
    } else {
      await refreshUser();
    }
    setAuthModalOpen(false);
  };

  const register = async (payload: RegisterPayload) => {
    const res = await api.register(payload);
    setPendingEmail(payload.email);
    if (res.otp) {
      setLastDispatchedOtp(res.otp);
    }
    setAuthModalView('verify-otp');
    return res;
  };

  const verifyOtp = async (payload: VerifyOtpPayload) => {
    const res = await api.verifyOtp(payload);
    setStoredToken(res.access_token);
    if (res.user) {
      setUser(res.user);
    } else {
      await refreshUser();
    }
    setAuthModalOpen(false);
    setPendingEmail('');
    setLastDispatchedOtp(null);
  };

  const resendOtp = async (payload: ResendOtpPayload) => {
    const res = await api.resendOtp(payload);
    if (res.otp) {
      setLastDispatchedOtp(res.otp);
    }
    return res;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      setStoredToken(null);
      setUser(null);
    }
  };

  const updateProfile = async (payload: UpdateProfilePayload) => {
    const updated = await api.patchMe(payload);
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        pendingEmail,
        authModalOpen,
        authModalView,
        lastDispatchedOtp,
        openAuthModal,
        closeAuthModal,
        setPendingEmail,
        login,
        register,
        verifyOtp,
        resendOtp,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
