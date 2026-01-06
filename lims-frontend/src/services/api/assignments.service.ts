import apiClient from './api.client';
import {
  Assignment,
  CreateAssignmentRequest,
  ReassignAssignmentRequest,
  UpdateAssignmentStatusRequest,
  QueryAssignmentsParams,
  AssignmentStatus,
  AvailableTechnician,
  AutoAssignPreviewItem,
  AutoAssignRequest,
} from '@/types/assignment.types';

export const assignmentsService = {
  // Auto assign tests for a patient
  autoAssign: async (patientId: string, overrides: Record<string, string> = {}): Promise<Assignment[]> => {
    const data: AutoAssignRequest = { overrides };
    const response = await apiClient.post<Assignment[]>(`/assignments/auto-assign/${patientId}`, data);
    return response.data;
  },

  // Preview auto assignment
  previewAutoAssign: async (patientId: string): Promise<AutoAssignPreviewItem[]> => {
    const response = await apiClient.get<AutoAssignPreviewItem[]>(`/assignments/auto-assign/${patientId}/preview`);
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


  async claimAssignment(assignmentId: string): Promise<Assignment> {
    const response = await apiClient.put<Assignment>(`/assignments/${assignmentId}/claim`);
    return response.data;
  },

  async getAssignmentsByPatient(patientId: string): Promise<Assignment[]> {
    const response = await apiClient.get<Assignment[]>(`/assignments/patient/${patientId}`);
    return response.data;
  },

  async getMyAssignments(status?: AssignmentStatus, projectId?: string): Promise<Assignment[]> {
    const params = new URLSearchParams();
    if (status) {
      params.append('status', status);
    }
    if (projectId) {
      params.append('projectId', projectId);
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
    if (query?.projectId) {
      params.append('projectId', query.projectId);
    }

    const response = await apiClient.get<Assignment[]>(
      `/assignments${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data;
  },

  /**
   * Get available technicians for a specific test type, optionally filtered by project
   * @param testId - The test ID to find technicians for
   * @param projectId - Optional project ID to filter technicians by project membership
   */
  async getAvailableTechnicians(testId: string, projectId?: string): Promise<AvailableTechnician[]> {
    const params = new URLSearchParams();
    params.append('testId', testId);
    if (projectId) {
      params.append('projectId', projectId);
    }

    const response = await apiClient.get<AvailableTechnician[]>(
      `/assignments/available-technicians?${params.toString()}`
    );
    return response.data;
  },
};


