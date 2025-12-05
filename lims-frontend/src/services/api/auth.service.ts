import apiClient from './api.client';
import { AuthResponse, LoginRequest, RefreshTokenRequest } from '../../types/api.types';
import { User } from '../../types/user.types';

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', {
      refreshToken,
    } as RefreshTokenRequest);
    return response.data;
  },

  async getCurrentUser(): Promise<Omit<User, 'passwordHash'>> {
    const response = await apiClient.get<Omit<User, 'passwordHash'>>('/auth/me');
    return response.data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/reset-password', { token, newPassword });
    return response.data;
  },
};

