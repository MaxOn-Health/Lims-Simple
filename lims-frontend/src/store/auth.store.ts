import { create } from 'zustand';
import { authService } from '../services/api/auth.service';
import { tokenStorage } from '../services/storage/token.storage';
import { User, AuthUser } from '../types/user.types';
import { ApiError } from '../types/api.types';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login({ email, password });
      tokenStorage.setAccessToken(response.accessToken);
      tokenStorage.setRefreshToken(response.refreshToken);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const apiError = error as ApiError;
      set({
        isLoading: false,
        error: Array.isArray(apiError.message)
          ? apiError.message.join(', ')
          : apiError.message || 'Login failed',
        isAuthenticated: false,
        user: null,
      });
      throw error;
    }
  },

  logout: () => {
    authService.logout().catch(() => {
      // Ignore logout errors
    });
    tokenStorage.clearTokens();
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  refreshToken: async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await authService.refreshToken(refreshToken);
      tokenStorage.setAccessToken(response.accessToken);
      tokenStorage.setRefreshToken(response.refreshToken);
      set({
        user: response.user,
        isAuthenticated: true,
      });
    } catch (error) {
      tokenStorage.clearTokens();
      set({
        user: null,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  getCurrentUser: async () => {
    set({ isLoading: true });
    try {
      const user = await authService.getCurrentUser();
      set({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          isActive: user.isActive,
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      tokenStorage.clearTokens();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

