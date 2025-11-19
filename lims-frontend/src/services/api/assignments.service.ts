import apiClient from './api.client';
import {
  Assignment,
  CreateAssignmentRequest,
  ReassignAssignmentRequest,
  UpdateAssignmentStatusRequest,
  QueryAssignmentsParams,
  AutoAssignResponse,
  AssignmentStatus,
} from '../../types/assignment.types';

export const assignmentsService = {
  async autoAssign(patientId: string): Promise<AutoAssignResponse> {
    const response = await apiClient.post<AutoAssignResponse>(
      `/assignments/auto-assign/${patientId}`
    );
    return response.data;
  },

  async manualAssign(data: CreateAssignmentRequest): Promise<Assignment> {
    const response = await apiClient.post<Assignment>('/assignments/manual-assign', data);
    return response.data;
  },

  async reassign(assignmentId: string, data: ReassignAssignmentRequest): Promise<Assignment> {
    const response = await apiClient.put<Assignment>(
      `/assignments/${assignmentId}/reassign`,
      data
    );
    return response.data;
  },

  async getAssignmentsByPatient(patientId: string): Promise<Assignment[]> {
    const response = await apiClient.get<Assignment[]>(`/assignments/patient/${patientId}`);
    return response.data;
  },

  async getMyAssignments(status?: AssignmentStatus): Promise<Assignment[]> {
    const params = new URLSearchParams();
    if (status) {
      params.append('status', status);
    }

    const response = await apiClient.get<Assignment[]>(
      `/assignments/my-assignments${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data;
  },

  async updateStatus(
    assignmentId: string,
    data: UpdateAssignmentStatusRequest
  ): Promise<Assignment> {
    const response = await apiClient.put<Assignment>(
      `/assignments/${assignmentId}/status`,
      data
    );
    return response.data;
  },

  async getAssignmentById(id: string): Promise<Assignment> {
    const response = await apiClient.get<Assignment>(`/assignments/${id}`);
    return response.data;
  },

  async getAllAssignments(query?: QueryAssignmentsParams): Promise<Assignment[]> {
    const params = new URLSearchParams();
    if (query?.status) {
      params.append('status', query.status);
    }
    if (query?.patientId) {
      params.append('patientId', query.patientId);
    }
    if (query?.adminId) {
      params.append('adminId', query.adminId);
    }
    if (query?.testId) {
      params.append('testId', query.testId);
    }

    // Note: This endpoint may need to be added to backend
    // For now, we'll try to use it and handle errors gracefully
    const response = await apiClient.get<Assignment[]>(
      `/assignments${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data;
  },
};

