'use client';

import { create } from 'zustand';
import { User, UserRole, QueryUsersParams, PaginatedUsersResponse } from '@/types/user.types';

interface UsersState {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    search: string;
    role?: UserRole;
    active?: boolean;
  };
  isLoading: boolean;
  error: string | null;
  setUsers: (users: User[]) => void;
  setPagination: (pagination: UsersState['pagination']) => void;
  setFilters: (filters: Partial<UsersState['filters']>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  users: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {
    search: '',
    role: undefined,
    active: undefined,
  },
  isLoading: false,
  error: null,
};

export const useUsersStore = create<UsersState>((set) => ({
  ...initialState,
  setUsers: (users) => set({ users }),
  setPagination: (pagination) => set({ pagination }),
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 }, // Reset to first page when filters change
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));

