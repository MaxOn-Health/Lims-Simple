'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { bloodSamplesService } from '@/services/api/blood-samples.service';
import { patientsService } from '@/services/api/patients.service';
import { BloodSample, BloodSampleStatus } from '@/types/blood-sample.types';
import { Patient } from '@/types/patient.types';
import { SampleTable } from '../SampleTable/SampleTable';
import { SampleFilters } from '../SampleFilters/SampleFilters';
import { SampleSearch } from '../SampleSearch/SampleSearch';
import { Pagination } from '@/components/common/Pagination/Pagination';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { useDebounce } from '@/hooks/useDebounce/useDebounce';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FlaskConical } from 'lucide-react';
import { Skeleton } from '@/components/common/Skeleton';
import { useProjectFilter } from '@/hooks/useProjectFilter';
import { ProjectSelector } from '@/components/common/ProjectSelector/ProjectSelector';

export const SampleList: React.FC = () => {
  const router = useRouter();
  const { addToast } = useUIStore();
  const {
    selectedProjectId,
    setSelectedProjectId,
    userProjects,
    isSuperAdmin,
    hasMultipleProjects,
  } = useProjectFilter();

  const [allSamples, setAllSamples] = useState<BloodSample[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
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
  const [statusFilter, setStatusFilter] = useState<BloodSampleStatus | undefined>();
  const [dateFromFilter, setDateFromFilter] = useState<string | undefined>();
  const [dateToFilter, setDateToFilter] = useState<string | undefined>();
  const [patientFilter, setPatientFilter] = useState<string | undefined>();
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch all samples
  const fetchAllSamples = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all samples with optional project filter
      const samples = await bloodSamplesService.getAllSamples(statusFilter, selectedProjectId || undefined);
      setAllSamples(samples);
    } catch (err) {
      const apiError = err as ApiError;
      setError(getErrorMessage(apiError));
      addToast({
        type: 'error',
        message: 'Failed to load samples',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFilterData = async () => {
    try {
      const patientsData = await patientsService.getPatients({
        limit: 100,
        projectId: selectedProjectId || undefined,
      });
      setPatients(patientsData.data);
    } catch (err) {
      // Silently fail - filters are optional
    }
  };

  useEffect(() => {
    fetchAllSamples();
    fetchFilterData();
  }, [statusFilter, selectedProjectId]);

  // Filter and search samples client-side
  const filteredSamples = useMemo(() => {
    let filtered = [...allSamples];

    // Apply search
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (sample) =>
          sample.sampleId.toLowerCase().includes(searchLower) ||
          sample.patient?.name.toLowerCase().includes(searchLower) ||
          sample.patient?.patientId.toLowerCase().includes(searchLower)
      );
    }

    // Apply filters
    if (statusFilter) {
      filtered = filtered.filter((sample) => sample.status === statusFilter);
    }
    if (patientFilter) {
      filtered = filtered.filter((sample) => sample.patient?.id === patientFilter);
    }
    if (dateFromFilter) {
      const dateFrom = new Date(dateFromFilter);
      filtered = filtered.filter((sample) => new Date(sample.collectedAt) >= dateFrom);
    }
    if (dateToFilter) {
      const dateTo = new Date(dateToFilter);
      dateTo.setHours(23, 59, 59, 999); // Include entire day
      filtered = filtered.filter((sample) => new Date(sample.collectedAt) <= dateTo);
    }

    return filtered;
  }, [allSamples, debouncedSearch, statusFilter, patientFilter, dateFromFilter, dateToFilter]);

  // Paginate filtered samples
  const paginatedSamples = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    return filteredSamples.slice(start, end);
  }, [filteredSamples, pagination.page, pagination.limit]);

  // Update pagination when filtered samples change
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      total: filteredSamples.length,
      totalPages: Math.ceil(filteredSamples.length / prev.limit),
      page: Math.min(prev.page, Math.max(1, Math.ceil(filteredSamples.length / prev.limit))),
    }));
  }, [filteredSamples.length]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleItemsPerPageChange = (limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setStatusFilter(undefined);
    setDateFromFilter(undefined);
    setDateToFilter(undefined);
    setPatientFilter(undefined);
    setSearchQuery('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleView = (sample: BloodSample) => {
    router.push(`/blood-samples/${sample.id}`);
  };

  const handleSubmitResult = (sample: BloodSample) => {
    router.push(`/blood-samples/${sample.id}/result`);
  };

  if (error && !isLoading) {
    return (
      <ErrorState
        title="Failed to load samples"
        message={error}
        onRetry={fetchAllSamples}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FlaskConical className="h-8 w-8 text-primary" />
            Blood Samples
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all blood samples
          </p>
        </div>
        {/* Project Filter */}
        {(hasMultipleProjects || isSuperAdmin) && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Project:</span>
            <ProjectSelector
              selectedProjectId={selectedProjectId}
              onSelect={setSelectedProjectId}
              projects={userProjects}
              showAllOption={isSuperAdmin}
              className="w-64"
              size="sm"
            />
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex-1">
              <SampleSearch value={searchQuery} onChange={handleSearchChange} />
            </div>
            <div className="flex-1">
              <SampleFilters
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                dateFromFilter={dateFromFilter}
                onDateFromFilterChange={setDateFromFilter}
                dateToFilter={dateToFilter}
                onDateToFilterChange={setDateToFilter}
                patientFilter={patientFilter}
                onPatientFilterChange={setPatientFilter}
                patients={patients}
                onReset={handleResetFilters}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} height="h-12" />
              ))}
            </div>
          ) : filteredSamples.length === 0 ? (
            <EmptyState
              title="No samples found"
              message={
                searchQuery || statusFilter || patientFilter || dateFromFilter || dateToFilter
                  ? 'Try adjusting your filters or search query.'
                  : 'No blood samples found.'
              }
            />
          ) : (
            <>
              <SampleTable
                samples={paginatedSamples}
                onView={handleView}
                onSubmitResult={handleSubmitResult}
              />
              {pagination.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.total}
                    itemsPerPage={pagination.limit}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

