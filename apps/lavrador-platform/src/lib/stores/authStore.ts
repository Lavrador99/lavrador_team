'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'CLIENT';
  name?: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,

      setAuth: (user, token) => {
        // Also write to cookie so Next.js middleware can read it
        if (typeof document !== 'undefined') {
          document.cookie = `access_token=${token}; path=/; max-age=${60 * 60}; SameSite=Strict`;
        }
        set({ user, accessToken: token });
      },

      setToken: (token) => {
        if (typeof document !== 'undefined') {
          document.cookie = `access_token=${token}; path=/; max-age=${60 * 60}; SameSite=Strict`;
        }
        set({ accessToken: token });
      },

      logout: () => {
        if (typeof document !== 'undefined') {
          document.cookie = 'access_token=; path=/; max-age=0';
        }
        set({ user: null, accessToken: null });
      },
    }),
    {
      name: 'lavrador-auth',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
    },
  ),
);
