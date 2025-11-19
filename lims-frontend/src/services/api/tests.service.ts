import apiClient from './api.client';
import {
  Test,
  CreateTestRequest,
  UpdateTestRequest,
  QueryTestsParams,
} from '../../types/test.types';

export const testsService = {
  async getTests(query?: QueryTestsParams): Promise<Test[]> {
    const params = new URLSearchParams();
    if (query?.category) {
      params.append('category', query.category);
    }
    if (query?.adminRole) {
      params.append('admin_role', query.adminRole);
    }
    if (query?.isActive !== undefined) {
      params.append('isActive', query.isActive.toString());
    }

    const response = await apiClient.get<Test[]>(
      `/tests${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data;
  },

  async getTestById(id: string): Promise<Test> {
    const response = await apiClient.get<Test>(`/tests/${id}`);
    return response.data;
  },

  async createTest(data: CreateTestRequest): Promise<Test> {
    const response = await apiClient.post<Test>('/tests', data);
    return response.data;
  },

  async updateTest(id: string, data: UpdateTestRequest): Promise<Test> {
    const response = await apiClient.put<Test>(`/tests/${id}`, data);
    return response.data;
  },

  async deleteTest(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/tests/${id}`);
    return response.data;
  },

  async getTestsByAdminRole(adminRole: string): Promise<Test[]> {
    const response = await apiClient.get<Test[]>(`/tests/by-admin-role/${adminRole}`);
    return response.data;
  },
};

