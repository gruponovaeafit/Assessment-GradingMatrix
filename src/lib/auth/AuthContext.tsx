"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface AuthUser {
  id: number;
  email: string;
  role: 'admin' | 'calificador' | 'registrador';
  isSuperAdmin: boolean;
  assessmentId: number | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isGrader: boolean;
  isRegistrar: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  assessmentId: number | null;
  login: (userData: AuthUser) => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser({
          id: data.id,
          email: data.email,
          role: data.role,
          isSuperAdmin: Boolean(data.isSuperAdmin),
          assessmentId: data.assessmentId || null,
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("❌ Error refreshing auth:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = useCallback((userData: AuthUser) => {
    setUser(userData);
    setIsLoading(false);
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("❌ Error during logout:", error);
    } finally {
      setUser(null);
      setIsLoading(false);
      router.push("/auth/login");
    }
  }, [router]);

  const value: AuthContextType = useMemo(() => ({
    user,
    isAdmin: user?.role === 'admin',
    isSuperAdmin: !!user?.isSuperAdmin,
    isGrader: user?.role === 'calificador',
    isRegistrar: user?.role === 'registrador',
    isAuthenticated: !!user,
    isLoading,
    assessmentId: user?.assessmentId || null,
    login,
    logout,
    refreshAuth,
  }), [user, isLoading, login, logout, refreshAuth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
