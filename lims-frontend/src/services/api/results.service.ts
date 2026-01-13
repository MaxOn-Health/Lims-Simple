import apiClient from './api.client';
import { Result, SubmitResultRequest, UpdateResultRequest } from '@/types/result.types';

export const resultsService = {
  async submitResult(data: SubmitResultRequest): Promise<Result> {
    const response = await apiClient.post<Result>('/results/submit', data);
    return response.data;
  },

  async getResultByAssignment(assignmentId: string): Promise<Result> {
    const response = await apiClient.get<Result>(`/results/assignment/${assignmentId}`);
    return response.data;
  },

  async getResultsByPatient(patientId: string): Promise<Result[]> {
    const response = await apiClient.get<Result[]>(`/results/patient/${patientId}`);
    return response.data;
  },

  async updateResult(id: string, data: UpdateResultRequest): Promise<Result> {
    const response = await apiClient.put<Result>(`/results/${id}`, data);
    return response.data;
  },

  async editResult(id: string, data: UpdateResultRequest): Promise<Result> {
    const response = await apiClient.put<Result>(`/results/edit/${id}`, data);
    return response.data;
  },

  async verifyResult(id: string): Promise<Result> {
    const response = await apiClient.post<Result>(`/results/${id}/verify`);
    return response.data;
  },

  async getResultById(id: string): Promise<Result> {
    const response = await apiClient.get<Result>(`/results/${id}`);
    return response.data;
  },
};

