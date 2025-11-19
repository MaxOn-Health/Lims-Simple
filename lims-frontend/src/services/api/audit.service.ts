import apiClient from './api.client';
import {
  AuditLog,
  PaginatedAuditLogsResponse,
  QueryAuditLogsParams,
} from '../../types/audit.types';

export const auditService = {
  async getAuditLogs(query?: QueryAuditLogsParams): Promise<PaginatedAuditLogsResponse> {
    const params = new URLSearchParams();
    if (query?.page !== undefined) params.append('page', query.page.toString());
    if (query?.limit !== undefined) params.append('limit', query.limit.toString());
    if (query?.userId) params.append('user_id', query.userId);
    if (query?.action) params.append('action', query.action);
    if (query?.entityType) params.append('entity_type', query.entityType);
    if (query?.dateFrom) params.append('date_from', query.dateFrom);
    if (query?.dateTo) params.append('date_to', query.dateTo);

    const response = await apiClient.get<PaginatedAuditLogsResponse>(
      `/audit-logs${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data;
  },

  async getAuditLogsForEntity(
    entityType: string,
    entityId: string
  ): Promise<AuditLog[]> {
    try {
      const response = await apiClient.get<AuditLog[]>(
        `/audit-logs/entity/${entityType}/${entityId}`
      );
      return response.data;
    } catch (error: any) {
      // If endpoint doesn't exist, return empty array
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },
};



