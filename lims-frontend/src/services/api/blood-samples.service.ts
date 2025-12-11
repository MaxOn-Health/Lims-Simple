import apiClient from './api.client';
import {
  BloodSample,
  RegisterBloodSampleRequest,
  RegisterBloodSampleResponse,
  AccessBloodSampleRequest,
  UpdateBloodSampleStatusRequest,
  SubmitBloodTestResultRequest,
  BloodSampleStatus,
} from '@/types/blood-sample.types';
import { Result } from '@/types/result.types';

export const bloodSamplesService = {
  async registerBloodSample(data: RegisterBloodSampleRequest): Promise<RegisterBloodSampleResponse> {
    const response = await apiClient.post<RegisterBloodSampleResponse>('/blood-samples/register', data);
    return response.data;
  },

  async accessBloodSample(data: AccessBloodSampleRequest): Promise<BloodSample> {
    const response = await apiClient.post<BloodSample>('/blood-samples/access', data);
    return response.data;
  },

  async updateStatus(id: string, data: UpdateBloodSampleStatusRequest): Promise<BloodSample> {
    const response = await apiClient.put<BloodSample>(`/blood-samples/${id}/status`, data);
    return response.data;
  },

  async getBloodSampleById(id: string): Promise<BloodSample> {
    const response = await apiClient.get<BloodSample>(`/blood-samples/${id}`);
    return response.data;
  },

  async getAllSamples(status?: BloodSampleStatus, projectId?: string): Promise<BloodSample[]> {
    const params = new URLSearchParams();
    if (status) {
      params.append('status', status);
    }
    if (projectId) {
      params.append('projectId', projectId);
    }
    const response = await apiClient.get<BloodSample[]>(
      `/blood-samples${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data;
  },

  async getMySamples(status?: BloodSampleStatus): Promise<BloodSample[]> {
    const params = new URLSearchParams();
    if (status) {
      params.append('status', status);
    }
    const response = await apiClient.get<BloodSample[]>(
      `/blood-samples/my-samples${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data;
  },

  async submitBloodTestResult(id: string, data: SubmitBloodTestResultRequest): Promise<Result> {
    const response = await apiClient.post<Result>(`/blood-samples/${id}/results`, data);
    return response.data;
  },
};

