import { create } from 'zustand';
import {
  Assignment,
  AssignmentStatus,
  QueryAssignmentsParams,
} from '@/types/assignment.types';
import { assignmentsService } from '@/services/api/assignments.service';

interface AssignmentsState {
  assignments: Assignment[];
  isLoading: boolean;
  error: string | null;
  filters: {
    search?: string;
    status?: AssignmentStatus;
    patientId?: string;
    adminId?: string;
    testId?: string;
  };
}

interface AssignmentsActions {
  fetchAssignments: (params?: QueryAssignmentsParams) => Promise<void>;
  fetchAssignmentsByPatient: (patientId: string) => Promise<void>;
  fetchMyAssignments: (status?: AssignmentStatus) => Promise<void>;
  setFilters: (filters: Partial<AssignmentsState['filters']>) => void;
  setSearchQuery: (search: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetFilters: () => void;
  updateAssignment: (assignment: Assignment) => void;
  addAssignment: (assignment: Assignment) => void;
  removeAssignment: (assignmentId: string) => void;
}

const initialState: AssignmentsState = {
  assignments: [],
  isLoading: false,
  error: null,
  filters: {},
};

export const useAssignmentsStore = create<AssignmentsState & AssignmentsActions>(
  (set, get) => ({
    ...initialState,

    fetchAssignments: async (params?: QueryAssignmentsParams) => {
      set({ isLoading: true, error: null });
      try {
        const currentFilters = get().filters;
        const queryParams: QueryAssignmentsParams = {
          ...params,
          status: params?.status || currentFilters.status,
          patientId: params?.patientId || currentFilters.patientId,
          adminId: params?.adminId || currentFilters.adminId,
          testId: params?.testId || currentFilters.testId,
        };

        // Try to use getAllAssignments, fallback to empty array if endpoint doesn't exist
        try {
          const assignments = await assignmentsService.getAllAssignments(queryParams);
          set({
            assignments,
            isLoading: false,
          });
        } catch (error: any) {
          // If endpoint doesn't exist, set empty array (will be handled by components)
          if (error?.response?.status === 404) {
            set({
              assignments: [],
              isLoading: false,
            });
          } else {
            throw error;
          }
        }
      } catch (error: any) {
        set({
          error: error?.message || 'Failed to fetch assignments',
          isLoading: false,
        });
      }
    },

    fetchAssignmentsByPatient: async (patientId: string) => {
      set({ isLoading: true, error: null });
      try {
        const assignments = await assignmentsService.getAssignmentsByPatient(patientId);
        set({
          assignments,
          isLoading: false,
        });
      } catch (error: any) {
        set({
          error: error?.message || 'Failed to fetch patient assignments',
          isLoading: false,
        });
      }
    },

    fetchMyAssignments: async (status?: AssignmentStatus) => {
      set({ isLoading: true, error: null });
      try {
        const assignments = await assignmentsService.getMyAssignments(status);
        set({
          assignments,
          isLoading: false,
        });
      } catch (error: any) {
        set({
          error: error?.message || 'Failed to fetch my assignments',
          isLoading: false,
        });
      }
    },

    setFilters: (filters: Partial<AssignmentsState['filters']>) => {
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

    updateAssignment: (assignment: Assignment) => {
      set((state) => ({
        assignments: state.assignments.map((a) =>
          a.id === assignment.id ? assignment : a
        ),
      }));
    },

    addAssignment: (assignment: Assignment) => {
      set((state) => ({
        assignments: [...state.assignments, assignment],
      }));
    },

    removeAssignment: (assignmentId: string) => {
      set((state) => ({
        assignments: state.assignments.filter((a) => a.id !== assignmentId),
      }));
    },
  })
);

