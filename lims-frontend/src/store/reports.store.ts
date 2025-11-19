import { create } from 'zustand';
import { Report, ReportReadiness, QueryReportsParams } from '@/types/report.types';
import { reportsService } from '@/services/api/reports.service';

interface ReportsState {
  reports: Report[];
  currentReport: Report | null;
  readiness: ReportReadiness | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  // Actions
  fetchReports: (query?: QueryReportsParams) => Promise<void>;
  fetchReport: (id: string) => Promise<void>;
  generateReport: (patientId: string) => Promise<Report>;
  checkReadiness: (patientId: string) => Promise<void>;
  clearError: () => void;
  setCurrentReport: (report: Report | null) => void;
}

export const useReportsStore = create<ReportsState>((set, get) => ({
  reports: [],
  currentReport: null,
  readiness: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },

  fetchReports: async (query?: QueryReportsParams) => {
    set({ isLoading: true, error: null });
    try {
      const response = await reportsService.getReports(query);
      set({
        reports: response.data,
        pagination: {
          page: response.page,
          limit: response.limit,
          total: response.total,
          totalPages: response.totalPages,
        },
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch reports',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchReport: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const report = await reportsService.getReportById(id);
      set({
        currentReport: report,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch report',
        isLoading: false,
      });
      throw error;
    }
  },

  generateReport: async (patientId: string) => {
    set({ isLoading: true, error: null });
    try {
      const report = await reportsService.generateReport(patientId);
      set({
        currentReport: report,
        isLoading: false,
      });
      return report;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to generate report',
        isLoading: false,
      });
      throw error;
    }
  },

  checkReadiness: async (patientId: string) => {
    set({ isLoading: true, error: null });
    try {
      const readinessData = await reportsService.checkReportReadiness(patientId);
      set({
        readiness: readinessData,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to check readiness',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setCurrentReport: (report: Report | null) => {
    set({ currentReport: report });
  },
}));



