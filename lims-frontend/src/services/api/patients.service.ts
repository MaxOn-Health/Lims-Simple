import apiClient from './api.client';
import {
  Patient,
  CreatePatientRequest,
  UpdatePatientRequest,
  UpdatePaymentRequest,
  QueryPatientsParams,
  PaginatedPatientsResponse,
  PaginatedPatientProgressResponse,
} from '../../types/patient.types';

export const patientsService = {
  async registerPatient(data: CreatePatientRequest): Promise<Patient> {
    const response = await apiClient.post<Patient>('/patients/register', data);
    return response.data;
  },

  async getPatients(query?: QueryPatientsParams): Promise<PaginatedPatientsResponse> {
    const params = new URLSearchParams();
    if (query?.page !== undefined) {
      params.append('page', query.page.toString());
    }
    if (query?.limit !== undefined) {
      params.append('limit', query.limit.toString());
    }
    if (query?.search) {
      params.append('search', query.search);
    }
    if (query?.dateFrom) {
      params.append('dateFrom', query.dateFrom);
    }
    if (query?.dateTo) {
      params.append('dateTo', query.dateTo);
    }
    if (query?.paymentStatus) {
      params.append('paymentStatus', query.paymentStatus);
    }
    if (query?.packageId) {
      params.append('packageId', query.packageId);
    }

    const response = await apiClient.get<PaginatedPatientsResponse>(
      `/patients${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data;
  },

  async getPatientById(id: string): Promise<Patient> {
    const response = await apiClient.get<Patient>(`/patients/${id}`);
    return response.data;
  },

  async getPatientByPatientId(patientId: string): Promise<Patient> {
    const response = await apiClient.get<Patient>(`/patients/by-patient-id/${patientId}`);
    return response.data;
  },

  async updatePatient(id: string, data: UpdatePatientRequest): Promise<Patient> {
    const response = await apiClient.put<Patient>(`/patients/${id}`, data);
    return response.data;
  },

  async updatePayment(id: string, data: UpdatePaymentRequest): Promise<Patient> {
    const response = await apiClient.put<Patient>(`/patients/${id}/payment`, data);
    return response.data;
  },

  async getPatientProgress(query?: QueryPatientsParams): Promise<PaginatedPatientProgressResponse> {
    const params = new URLSearchParams();
    if (query?.page !== undefined) {
      params.append('page', query.page.toString());
    }
    if (query?.limit !== undefined) {
      params.append('limit', query.limit.toString());
    }
    if (query?.search) {
      params.append('search', query.search);
    }
    if (query?.dateFrom) {
      params.append('dateFrom', query.dateFrom);
    }
    if (query?.dateTo) {
      params.append('dateTo', query.dateTo);
    }

    const response = await apiClient.get<PaginatedPatientProgressResponse>(
      `/patients/progress${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data;
  },
};

