'use client';

import { create } from 'zustand';
import { Test, TestCategory, QueryTestsParams } from '@/types/test.types';

interface TestsState {
  tests: Test[];
  filters: {
    category?: TestCategory;
    adminRole?: string;
    isActive?: boolean;
  };
  isLoading: boolean;
  error: string | null;
  setTests: (tests: Test[]) => void;
  setFilters: (filters: Partial<TestsState['filters']>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  tests: [],
  filters: {
    category: undefined,
    adminRole: undefined,
    isActive: undefined,
  },
  isLoading: false,
  error: null,
};

export const useTestsStore = create<TestsState>((set) => ({
  ...initialState,
  setTests: (tests) => set({ tests }),
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));

