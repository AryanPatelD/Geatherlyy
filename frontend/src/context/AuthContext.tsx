'use client';

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { create } from 'zustand';
import { getApiUrl } from '@/lib/apiUrl';

export type UserRole = 'member' | 'coordinator' | 'faculty' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  universityId: string;
  department: string;
  year?: string;
  phone?: string;
  role: UserRole;
  profileComplete: boolean;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  avatar?: string;
  mustChangePassword?: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  initialize: () => Promise<void>;
  getToken: () => string | null;
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  initialized: false,
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
      initialized: true,
    }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
  initialize: async () => {
    if (get().initialized) return;

    const token = localStorage.getItem('token');
    if (!token) {
      set({ isLoading: false, initialized: true });
      return;
    }

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const userData = await response.json();

      const user: User = {
        id: userData.id?.toString() || '',
        email: userData.email || '',
        name: userData.name || '',
        universityId: userData.universityId || '',
        department: userData.department || '',
        year: userData.year || '',
        phone: userData.phone || '',
        role: userData.role?.toLowerCase() || 'member',
        profileComplete: userData.profileComplete || false,
        approvalStatus: userData.approvalStatus,
        avatar: userData.avatar,
        mustChangePassword: userData.mustChangePassword || false,
      };

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        initialized: true,
      });
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      localStorage.removeItem('token');
      set({ isLoading: false, initialized: true });
    }
  },
  getToken: () => {
    return localStorage.getItem('token');
  },
}));

// Hook to initialize auth on app mount
export function useInitializeAuth() {
  const initialize = useAuthStore((state) => state.initialize);
  const initialized = useAuthStore((state) => state.initialized);

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialize, initialized]);
}

export { useAuthStore };
