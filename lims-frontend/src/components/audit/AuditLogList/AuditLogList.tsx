'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auditService } from '@/services/api/audit.service';
import { AuditLog, QueryAuditLogsParams } from '@/types/audit.types';
import { AuditLogTable } from '../AuditLogTable/AuditLogTable';
import { AuditLogFilters } from '../AuditLogFilters/AuditLogFilters';
import { AuditLogSearch } from '../AuditLogSearch/AuditLogSearch';
import { Pagination } from '@/components/common/Pagination/Pagination';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { useDebounce } from '@/hooks/useDebounce/useDebounce';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download } from 'lucide-react';
import { Skeleton } from '@/components/common/Skeleton';
import { exportAuditLogsToCSV } from '@/utils/audit-helpers';
import { Button } from '@/components/common/Button/Button';

export const AuditLogList: React.FC = () => {
  const router = useRouter();
  const { addToast } = useUIStore();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [userIdFilter, setUserIdFilter] = useState<string | undefined>();
  const [actionFilter, setActionFilter] = useState<string | undefined>();
  const [entityTypeFilter, setEntityTypeFilter] = useState<string | undefined>();
  const [dateFrom, setDateFrom] = useState<string | undefined>();
  const [dateTo, setDateTo] = useState<string | undefined>();
  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams: QueryAuditLogsParams = {
        page: pagination.page,
        limit: pagination.limit,
        userId: userIdFilter,
        action: actionFilter,
        entityType: entityTypeFilter,
        dateFrom,
        dateTo,
      };

      const response = await auditService.getAuditLogs(queryParams);
      
      // Filter by search query if provided (client-side filtering)
      let filteredLogs = response.data;
      if (debouncedSearch) {
        filteredLogs = response.data.filter(
          (log) =>
            log.action.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            log.entityType.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            log.user?.fullName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            log.user?.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            log.entityId?.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
      }

      setLogs(filteredLogs);
      setPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
      });
    } catch (err) {
      const apiError = err as ApiError;
      // Handle 404 gracefully (endpoint might not exist yet)
      if (apiError.statusCode === 404) {
        setError('Audit logs endpoint is not available. Please ensure the backend API is implemented.');
      } else {
        setError(getErrorMessage(apiError));
      }
      addToast({
        type: 'error',
        message: 'Failed to load audit logs',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [pagination.page, pagination.limit, userIdFilter, actionFilter, entityTypeFilter, dateFrom, dateTo, debouncedSearch]);

  const handleEntityClick = (entityType: string, entityId: string) => {
    router.push(`/audit-logs/entity/${entityType}/${entityId}`);
  };

  const handleExport = () => {
    try {
      exportAuditLogsToCSV(logs);
      addToast({
        type: 'success',
        message: 'Audit logs exported successfully',
      });
    } catch (err) {
      addToast({
        type: 'error',
        message: 'Failed to export audit logs',
      });
    }
  };

  const handleClearFilters = () => {
    setUserIdFilter(undefined);
    setActionFilter(undefined);
    setEntityTypeFilter(undefined);
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearchQuery('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  if (error && !isLoading) {
    return (
      <ErrorState
        title="Failed to load audit logs"
        message={error}
        onRetry={fetchAuditLogs}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AuditLogSearch value={searchQuery} onChange={setSearchQuery} />
          <AuditLogFilters
            userId={userIdFilter}
            action={actionFilter}
            entityType={entityTypeFilter}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onUserIdChange={setUserIdFilter}
            onActionChange={setActionFilter}
            onEntityTypeChange={setEntityTypeFilter}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onClear={handleClearFilters}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Audit Logs ({pagination.total})
            </CardTitle>
            {logs.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton height="h-10" />
              <Skeleton height="h-40" />
              <Skeleton height="h-10" />
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              title="No Audit Logs Found"
              message="There are no audit logs matching your criteria."
            />
          ) : (
            <>
              <AuditLogTable logs={logs} onEntityClick={handleEntityClick} />
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
                onItemsPerPageChange={(limit) =>
                  setPagination((prev) => ({ ...prev, limit, page: 1 }))
                }
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};



