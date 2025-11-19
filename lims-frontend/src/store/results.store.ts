import { create } from 'zustand';
import { Result, ResultStatus } from '@/types/result.types';
import { resultsService } from '@/services/api/results.service';

interface ResultsState {
  results: Result[];
  isLoading: boolean;
  error: string | null;
  filters: {
    search?: string;
    status?: ResultStatus;
    patientId?: string;
    testId?: string;
    isVerified?: boolean;
  };
}

interface ResultsActions {
  fetchResultsByPatient: (patientId: string) => Promise<void>;
  fetchAllResults: () => Promise<void>;
  setFilters: (filters: Partial<ResultsState['filters']>) => void;
  setSearchQuery: (search: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetFilters: () => void;
  updateResult: (result: Result) => void;
  addResult: (result: Result) => void;
  removeResult: (resultId: string) => void;
}

const initialState: ResultsState = {
  results: [],
  isLoading: false,
  error: null,
  filters: {},
};

export const useResultsStore = create<ResultsState & ResultsActions>((set, get) => ({
  ...initialState,

  fetchResultsByPatient: async (patientId: string) => {
    set({ isLoading: true, error: null });
    try {
      const results = await resultsService.getResultsByPatient(patientId);
      set({
        results,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error?.message || 'Failed to fetch patient results',
        isLoading: false,
      });
    }
  },

  fetchAllResults: async () => {
    set({ isLoading: true, error: null });
    try {
      // Since there's no GET /results endpoint, fetch from all patients
      // This is handled by components directly
      set({
        results: [],
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error?.message || 'Failed to fetch results',
        isLoading: false,
      });
    }
  },

  setFilters: (filters: Partial<ResultsState['filters']>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  setSearchQuery: (search: string) => {
    set((state) => ({
      filters: { ...state.filters, search },
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

  updateResult: (result: Result) => {
    set((state) => ({
      results: state.results.map((r) => (r.id === result.id ? result : r)),
    }));
  },

  addResult: (result: Result) => {
    set((state) => ({
      results: [...state.results, result],
    }));
  },

  removeResult: (resultId: string) => {
    set((state) => ({
      results: state.results.filter((r) => r.id !== resultId),
    }));
  },
}));

