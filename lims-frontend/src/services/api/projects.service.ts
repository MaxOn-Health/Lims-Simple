import apiClient from './api.client';
import {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  QueryProjectsParams,
  PaginatedProjectsResponse,
} from '../../types/project.types';

export const projectsService = {
  async getProjects(query?: QueryProjectsParams): Promise<PaginatedProjectsResponse> {
    const params = new URLSearchParams();
    if (query?.page !== undefined) params.append('page', query.page.toString());
    if (query?.limit !== undefined) params.append('limit', query.limit.toString());
    if (query?.search) params.append('search', query.search);
    if (query?.status) params.append('status', query.status);
    if (query?.companyName) params.append('companyName', query.companyName);
    if (query?.campDateFrom) params.append('campDateFrom', query.campDateFrom);
    if (query?.campDateTo) params.append('campDateTo', query.campDateTo);

    const response = await apiClient.get<PaginatedProjectsResponse>(
      `/projects${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data;
  },

  async getActiveProjects(): Promise<Project[]> {
    const response = await apiClient.get<Project[]>('/projects/active');
    return response.data;
  },

  async getProjectById(id: string): Promise<Project> {
    const response = await apiClient.get<Project>(`/projects/${id}`);
    return response.data;
  },

  async createProject(data: CreateProjectRequest): Promise<Project> {
    const response = await apiClient.post<Project>('/projects', data);
    return response.data;
  },

  async updateProject(id: string, data: UpdateProjectRequest): Promise<Project> {
    const response = await apiClient.put<Project>(`/projects/${id}`, data);
    return response.data;
  },

  async updateProjectStatus(id: string, status: string): Promise<Project> {
    const response = await apiClient.patch<Project>(`/projects/${id}/status?status=${status}`);
    return response.data;
  },

  async deleteProject(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/projects/${id}`);
    return response.data;
  },
};

