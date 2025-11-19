import { create } from 'zustand';
import { BloodSample, BloodSampleStatus } from '@/types/blood-sample.types';
import { bloodSamplesService } from '@/services/api/blood-samples.service';

interface BloodSamplesState {
  samples: BloodSample[];
  isLoading: boolean;
  error: string | null;
  filters: {
    search?: string;
    status?: BloodSampleStatus;
    patientId?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

interface BloodSamplesActions {
  fetchMySamples: (status?: BloodSampleStatus) => Promise<void>;
  fetchSampleById: (id: string) => Promise<BloodSample | null>;
  setFilters: (filters: Partial<BloodSamplesState['filters']>) => void;
  setSearchQuery: (search: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetFilters: () => void;
  updateSample: (sample: BloodSample) => void;
  addSample: (sample: BloodSample) => void;
  removeSample: (sampleId: string) => void;
}

const initialState: BloodSamplesState = {
  samples: [],
  isLoading: false,
  error: null,
  filters: {},
};

export const useBloodSamplesStore = create<BloodSamplesState & BloodSamplesActions>((set, get) => ({
  ...initialState,

  fetchMySamples: async (status?: BloodSampleStatus) => {
    set({ isLoading: true, error: null });
    try {
      const samples = await bloodSamplesService.getMySamples(status);
      set({
        samples,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error?.message || 'Failed to fetch samples',
        isLoading: false,
      });
    }
  },

  fetchSampleById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const sample = await bloodSamplesService.getBloodSampleById(id);
      set({
        isLoading: false,
      });
      return sample;
    } catch (error: any) {
      set({
        error: error?.message || 'Failed to fetch sample',
        isLoading: false,
      });
      return null;
    }
  },

  setFilters: (filters: Partial<BloodSamplesState['filters']>) => {
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

  updateSample: (sample: BloodSample) => {
    set((state) => ({
      samples: state.samples.map((s) => (s.id === sample.id ? sample : s)),
    }));
  },

  addSample: (sample: BloodSample) => {
    set((state) => ({
      samples: [...state.samples, sample],
    }));
  },

  removeSample: (sampleId: string) => {
    set((state) => ({
      samples: state.samples.filter((s) => s.id !== sampleId),
    }));
  },
}));

