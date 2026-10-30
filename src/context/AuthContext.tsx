import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password?: string) => Promise<User>;
  register: (nombre: string, email: string, password?: string) => Promise<User>;
  logout: () => Promise<void>;
  recoverPassword: (email: string) => Promise<{ success: boolean; message: string; resetToken?: string }>;
  resetPassword: (email: string, newPass: string) => Promise<boolean>;
  switchDemoUser: (role: 'admin' | 'user') => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: {
    nombre: string;
    email: string;
    currentPassword?: string;
    newPassword?: string;
    avatarUrl?: string;
  }) => Promise<User>;
  updateUser: (
    userId: string,
    data: {
      nombre?: string;
      email?: string;
      rol?: 'admin' | 'user';
      password?: string;
      avatarUrl?: string;
    }
  ) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const current = await api.auth.getCurrentUser();
      setUser(current);
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const current = await api.auth.getCurrentUser();
        setUser(current);
      } catch (err) {
        console.error('Failed to load session', err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, password?: string): Promise<User> => {
    const logged = await api.auth.login(email, password);
    setUser(logged);
    return logged;
  };

  const register = async (nombre: string, email: string, password?: string): Promise<User> => {
    const newUser = await api.auth.register(nombre, email, password);
    setUser(newUser);
    return newUser;
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
  };

  const recoverPassword = async (email: string) => {
    return api.auth.recoverPassword(email);
  };

  const resetPassword = async (email: string, newPass: string) => {
    return api.auth.resetPassword(email, newPass);
  };

  const updateProfile = async (data: {
    nombre: string;
    email: string;
    currentPassword?: string;
    newPassword?: string;
    avatarUrl?: string;
  }): Promise<User> => {
    if (!user) throw new Error('No hay sesión activa.');
    const updated = await api.auth.updateProfile(user.id, data);
    setUser(updated);
    return updated;
  };

  const updateUser = async (
    userId: string,
    data: {
      nombre?: string;
      email?: string;
      rol?: 'admin' | 'user';
      password?: string;
      avatarUrl?: string;
    }
  ): Promise<User> => {
    const updated = await api.auth.updateUser(userId, data);
    if (user && user.id === userId) {
      setUser(updated);
    }
    return updated;
  };

  const switchDemoUser = async (role: 'admin' | 'user') => {
    const users = await api.auth.getAllUsers();
    const target = users.find(u => u.rol === role);
    if (target) {
      await api.auth.login(target.email);
      setUser(target);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAdmin: user?.rol === 'admin',
    login,
    register,
    logout,
    recoverPassword,
    resetPassword,
    switchDemoUser,
    refreshUser,
    updateProfile,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
