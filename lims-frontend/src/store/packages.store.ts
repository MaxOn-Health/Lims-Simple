'use client';

import { create } from 'zustand';
import { Package, QueryPackagesParams } from '@/types/package.types';

interface PackagesState {
  packages: Package[];
  filters: {
    isActive?: boolean;
  };
  isLoading: boolean;
  error: string | null;
  setPackages: (packages: Package[]) => void;
  setFilters: (filters: Partial<PackagesState['filters']>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  packages: [],
  filters: {
    isActive: undefined,
  },
  isLoading: false,
  error: null,
};

export const usePackagesStore = create<PackagesState>((set) => ({
  ...initialState,
  setPackages: (packages) => set({ packages }),
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));

