import { create } from 'zustand';
import { AuditLog, QueryAuditLogsParams } from '@/types/audit.types';
import { auditService } from '@/services/api/audit.service';

interface AuditState {
  logs: AuditLog[];
  entityLogs: AuditLog[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    userId?: string;
    action?: string;
    entityType?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  };

  // Actions
  fetchAuditLogs: (query?: QueryAuditLogsParams) => Promise<void>;
  fetchEntityAuditTrail: (entityType: string, entityId: string) => Promise<void>;
  setFilters: (filters: Partial<AuditState['filters']>) => void;
  clearFilters: () => void;
  clearError: () => void;
}

export const useAuditStore = create<AuditState>((set, get) => ({
  logs: [],
  entityLogs: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {},

  fetchAuditLogs: async (query?: QueryAuditLogsParams) => {
    set({ isLoading: true, error: null });
    try {
      const currentFilters = get().filters;
      const queryParams: QueryAuditLogsParams = {
        ...query,
        userId: query?.userId || currentFilters.userId,
        action: query?.action || currentFilters.action,
        entityType: query?.entityType || currentFilters.entityType,
        dateFrom: query?.dateFrom || currentFilters.dateFrom,
        dateTo: query?.dateTo || currentFilters.dateTo,
        search: query?.search || currentFilters.search,
      };

      const response = await auditService.getAuditLogs(queryParams);
      set({
        logs: response.data,
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
        error: error.message || 'Failed to fetch audit logs',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchEntityAuditTrail: async (entityType: string, entityId: string) => {
    set({ isLoading: true, error: null });
    try {
      const logs = await auditService.getAuditLogsForEntity(entityType, entityId);
      set({
        entityLogs: logs.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ),
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch entity audit trail',
        isLoading: false,
      });
      throw error;
    }
  },

  setFilters: (filters: Partial<AuditState['filters']>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  clearFilters: () => {
    set({
      filters: {},
      pagination: { ...get().pagination, page: 1 },
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));



