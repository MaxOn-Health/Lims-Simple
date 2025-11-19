'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { reportsService } from '@/services/api/reports.service';
import { Report, ReportStatus, QueryReportsParams } from '@/types/report.types';
import { ReportTable } from '../ReportTable/ReportTable';
import { ReportFilters } from '../ReportFilters/ReportFilters';
import { ReportSearch } from '../ReportSearch/ReportSearch';
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
import { downloadReport } from '@/utils/report-download';

export const ReportList: React.FC = () => {
  const router = useRouter();
  const { addToast } = useUIStore();

  const [reports, setReports] = useState<Report[]>([]);
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
  const [statusFilter, setStatusFilter] = useState<ReportStatus | undefined>();
  const [dateFrom, setDateFrom] = useState<string | undefined>();
  const [dateTo, setDateTo] = useState<string | undefined>();
  const [patientIdFilter, setPatientIdFilter] = useState<string | undefined>();
  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams: QueryReportsParams = {
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter,
        dateFrom,
        dateTo,
        patientId: patientIdFilter,
      };

      const response = await reportsService.getReports(queryParams);
      
      // Filter by search query if provided
      let filteredReports = response.data;
      if (debouncedSearch) {
        filteredReports = response.data.filter(
          (report) =>
            report.reportNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            report.patient?.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            report.patient?.patientId.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
      }

      setReports(filteredReports);
      setPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
      });
    } catch (err) {
      const apiError = err as ApiError;
      setError(getErrorMessage(apiError));
      addToast({
        type: 'error',
        message: 'Failed to load reports',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [pagination.page, pagination.limit, statusFilter, dateFrom, dateTo, patientIdFilter, debouncedSearch]);

  const handleView = (reportId: string) => {
    router.push(`/reports/${reportId}`);
  };

  const handleDownload = async (reportId: string) => {
    try {
      await downloadReport(reportId);
      addToast({
        type: 'success',
        message: 'Report downloaded successfully',
      });
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError) || 'Failed to download report',
      });
    }
  };

  const handleClearFilters = () => {
    setStatusFilter(undefined);
    setDateFrom(undefined);
    setDateTo(undefined);
    setPatientIdFilter(undefined);
    setSearchQuery('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  if (error && !isLoading) {
    return (
      <ErrorState
        title="Failed to load reports"
        message={error}
        onRetry={fetchReports}
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
          <ReportSearch value={searchQuery} onChange={setSearchQuery} />
          <ReportFilters
            status={statusFilter}
            dateFrom={dateFrom}
            dateTo={dateTo}
            patientId={patientIdFilter}
            onStatusChange={setStatusFilter}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onPatientIdChange={setPatientIdFilter}
            onClear={handleClearFilters}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Reports ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton height="h-10" />
              <Skeleton height="h-40" />
              <Skeleton height="h-10" />
            </div>
          ) : reports.length === 0 ? (
            <EmptyState
              title="No Reports Found"
              message="There are no reports matching your criteria."
            />
          ) : (
            <>
              <ReportTable
                reports={reports}
                onView={handleView}
                onDownload={handleDownload}
              />
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



