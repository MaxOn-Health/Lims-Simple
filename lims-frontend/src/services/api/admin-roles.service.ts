import apiClient from './api.client';
import { AdminRole, CreateAdminRoleRequest, UpdateAdminRoleRequest } from '../../types/admin-role.types';

export const adminRolesService = {
    async getAdminRoles(includeInactive = false): Promise<AdminRole[]> {
        const params = includeInactive ? '?includeInactive=true' : '';
        const response = await apiClient.get<AdminRole[]>(`/admin-roles${params}`);
        return response.data;
    },

    async getAdminRoleById(id: string): Promise<AdminRole> {
        const response = await apiClient.get<AdminRole>(`/admin-roles/${id}`);
        return response.data;
    },

    async createAdminRole(data: CreateAdminRoleRequest): Promise<AdminRole> {
        const response = await apiClient.post<AdminRole>('/admin-roles', data);
        return response.data;
    },

    async updateAdminRole(id: string, data: UpdateAdminRoleRequest): Promise<AdminRole> {
        const response = await apiClient.put<AdminRole>(`/admin-roles/${id}`, data);
        return response.data;
    },

    async deleteAdminRole(id: string): Promise<{ message: string }> {
        const response = await apiClient.delete<{ message: string }>(`/admin-roles/${id}`);
        return response.data;
    },
};
