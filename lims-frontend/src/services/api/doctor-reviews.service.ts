import apiClient from './api.client';
import {
  PatientReview,
  PatientResults,
  Review,
  CreateReviewRequest,
  SignReportRequest,
  QueryPatientsParams,
  PaginatedPatientsResponse,
  QuerySignedReportsParams,
} from '../../types/doctor-review.types';

export const doctorReviewsService = {
  async getPatientsForReview(
    params?: QueryPatientsParams
  ): Promise<PaginatedPatientsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) {
      queryParams.append('status', params.status);
    }
    if (params?.search) {
      queryParams.append('search', params.search);
    }
    if (params?.page !== undefined) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.limit !== undefined) {
      queryParams.append('limit', params.limit.toString());
    }

    const response = await apiClient.get<PaginatedPatientsResponse>(
      `/doctor/patients${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
    return response.data;
  },

  async getPatientResults(patientId: string): Promise<PatientResults> {
    const response = await apiClient.get<PatientResults>(
      `/doctor/patient/${patientId}/results`
    );
    return response.data;
  },

  async createOrUpdateReview(data: CreateReviewRequest): Promise<Review> {
    const response = await apiClient.post<Review>('/doctor/review', data);
    return response.data;
  },

  async signReport(data: SignReportRequest): Promise<Review> {
    const response = await apiClient.post<Review>('/doctor/sign-report', data);
    return response.data;
  },

  async getSignedReports(
    params?: QuerySignedReportsParams
  ): Promise<PaginatedPatientsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.limit !== undefined) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.dateFrom) {
      queryParams.append('dateFrom', params.dateFrom);
    }
    if (params?.dateTo) {
      queryParams.append('dateTo', params.dateTo);
    }

    const response = await apiClient.get<PaginatedPatientsResponse>(
      `/doctor/signed-reports${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
    return response.data;
  },
};

