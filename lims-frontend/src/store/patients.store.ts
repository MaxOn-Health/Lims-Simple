import { create } from 'zustand';
import { Patient, PaymentStatus, QueryPatientsParams } from '@/types/patient.types';
import { patientsService } from '@/services/api/patients.service';
import { PaginatedPatientsResponse } from '@/types/patient.types';

interface PatientsState {
  patients: Patient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  error: string | null;
  filters: {
    search?: string;
    paymentStatus?: PaymentStatus;
    dateFrom?: string;
    dateTo?: string;
    packageId?: string;
  };
}

interface PatientsActions {
  fetchPatients: (params?: QueryPatientsParams) => Promise<void>;
  setFilters: (filters: Partial<PatientsState['filters']>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetFilters: () => void;
}

const initialState: PatientsState = {
  patients: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  isLoading: false,
  error: null,
  filters: {},
};

export const usePatientsStore = create<PatientsState & PatientsActions>((set, get) => ({
  ...initialState,

  fetchPatients: async (params?: QueryPatientsParams) => {
    set({ isLoading: true, error: null });
    try {
      const currentFilters = get().filters;
      const queryParams: QueryPatientsParams = {
        ...params,
        search: params?.search || currentFilters.search,
        paymentStatus: params?.paymentStatus || currentFilters.paymentStatus,
        dateFrom: params?.dateFrom || currentFilters.dateFrom,
        dateTo: params?.dateTo || currentFilters.dateTo,
        packageId: params?.packageId || currentFilters.packageId,
      };

      const response: PaginatedPatientsResponse = await patientsService.getPatients(queryParams);
      set({
        patients: response.data,
        pagination: {
          page: response.meta.page,
          limit: response.meta.limit,
          total: response.meta.total,
          totalPages: response.meta.totalPages,
        },
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error?.message || 'Failed to fetch patients',
        isLoading: false,
      });
    }
  },

  setFilters: (filters: Partial<PatientsState['filters']>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  resetFilters: () => {
    set({ filters: {} });
  },
}));

