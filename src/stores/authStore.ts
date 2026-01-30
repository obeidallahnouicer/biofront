import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import apiClient from '@/lib/api/client';
import wsClient from '@/lib/socket/client';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<boolean>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const tokens = await apiClient.login(email, password);
          const user = await apiClient.getCurrentUser();
          set({ user, isAuthenticated: true, error: null });

          // Connect WebSocket
          wsClient.connect(tokens.access_token);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          set({ error: message, isAuthenticated: false, user: null });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (email, password, fullName) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.register({ email, password, full_name: fullName });
          // Auto-login after registration
          await get().login(email, password);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Registration failed';
          set({ error: message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await apiClient.logout();
          wsClient.disconnect();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({ user: null, isAuthenticated: false, isLoading: false, error: null });
        }
      },

      fetchCurrentUser: async () => {
        set({ isLoading: true, error: null });
        try {
          const user = await apiClient.getCurrentUser();
          set({ user, isAuthenticated: true });

          // Connect WebSocket if not connected
          const token = globalThis.window !== undefined
            ? localStorage.getItem('access_token') 
            : null;
          if (token && !wsClient.isConnected()) {
            wsClient.connect(token);
          }
        } catch (error) {
          set({ user: null, isAuthenticated: false });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      updateUser: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const updatedUser = await apiClient.updateCurrentUser(data);
          set({ user: updatedUser });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Update failed';
          set({ error: message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      checkAuth: async () => {
        const token = globalThis.window !== undefined
          ? localStorage.getItem('access_token') 
          : null;
        
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return false;
        }

        try {
          await get().fetchCurrentUser();
          return true;
        } catch {
          apiClient.clearTokens();
          set({ isAuthenticated: false, user: null });
          return false;
        }
      },

      initializeAuth: async () => {
        set({ isLoading: true });
        try {
          await get().checkAuth();
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
