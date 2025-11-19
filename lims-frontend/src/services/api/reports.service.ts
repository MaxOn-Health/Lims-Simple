import apiClient from './api.client';
import {
  Report,
  PaginatedReportsResponse,
  QueryReportsParams,
  ReportReadiness,
  GenerateReportResponse,
} from '../../types/report.types';

export const reportsService = {
  async getReports(query?: QueryReportsParams): Promise<PaginatedReportsResponse> {
    const params = new URLSearchParams();
    if (query?.page !== undefined) params.append('page', query.page.toString());
    if (query?.limit !== undefined) params.append('limit', query.limit.toString());
    if (query?.status) params.append('status', query.status);
    if (query?.dateFrom) params.append('dateFrom', query.dateFrom);
    if (query?.dateTo) params.append('dateTo', query.dateTo);
    if (query?.patientId) params.append('patientId', query.patientId);

    const response = await apiClient.get<PaginatedReportsResponse>(
      `/reports${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data;
  },

  async getReportById(id: string): Promise<Report> {
    const response = await apiClient.get<Report>(`/reports/${id}`);
    return response.data;
  },

  async getReportByPatientId(patientId: string): Promise<Report | null> {
    try {
      const response = await apiClient.get<Report>(`/reports/patient/${patientId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async generateReport(patientId: string): Promise<GenerateReportResponse> {
    const response = await apiClient.post<GenerateReportResponse>(
      `/reports/generate/${patientId}`
    );
    return response.data;
  },

  async checkReportReadiness(patientId: string): Promise<ReportReadiness> {
    // Note: This endpoint might need to be added to the backend
    // For now, we'll use the doctor-reviews endpoint if available
    // Otherwise, we'll handle it client-side by checking the report generation requirements
    try {
      const response = await apiClient.get<ReportReadiness>(
        `/doctor-reviews/readiness/${patientId}`
      );
      return response.data;
    } catch (error: any) {
      // If endpoint doesn't exist, return a default response
      // The component will handle checking readiness through other means
      if (error.response?.status === 404) {
        // Try to get patient review to check readiness
        try {
          const reviewResponse = await apiClient.get(
            `/doctor-reviews/patient/${patientId}`
          );
          const review = reviewResponse.data;
          return {
            isReady: review.isSigned && review.completedTests === review.totalTests,
            details: {
              allAssignmentsSubmitted: review.completedTests === review.totalTests,
              allResultsExist: review.completedTests === review.totalTests,
              bloodTestCompleted: true, // Assume true if no blood sample
              reviewExists: !!review,
              isSigned: review.isSigned || false,
            },
          };
        } catch {
          return {
            isReady: false,
            details: {
              allAssignmentsSubmitted: false,
              allResultsExist: false,
              bloodTestCompleted: false,
              reviewExists: false,
              isSigned: false,
            },
          };
        }
      }
      throw error;
    }
  },

  async downloadReport(id: string): Promise<Blob> {
    const response = await apiClient.get(`/reports/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};



