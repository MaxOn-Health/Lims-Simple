import apiClient from './api.client';
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
  QueryUsersParams,
  PaginatedUsersResponse,
} from '../../types/user.types';

export const usersService = {
  async getUsers(query?: QueryUsersParams): Promise<PaginatedUsersResponse> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.role) params.append('role', query.role);
    if (query?.search) params.append('search', query.search);

    const response = await apiClient.get<PaginatedUsersResponse>(
      `/users?${params.toString()}`
    );
    return response.data;
  },

  async getUserById(id: string): Promise<User> {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  async createUser(data: CreateUserRequest): Promise<User> {
    const response = await apiClient.post<User>('/users', data);
    return response.data;
  },

  async updateUser(id: string, data: UpdateUserRequest): Promise<User> {
    const response = await apiClient.put<User>(`/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/users/${id}`);
    return response.data;
  },

  async changePassword(
    id: string,
    data: ChangePasswordRequest
  ): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      `/users/${id}/change-password`,
      data
    );
    return response.data;
  },
};

