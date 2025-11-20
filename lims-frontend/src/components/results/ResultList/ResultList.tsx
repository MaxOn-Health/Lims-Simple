'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { resultsService } from '@/services/api/results.service';
import { patientsService } from '@/services/api/patients.service';
import { testsService } from '@/services/api/tests.service';
import { assignmentsService } from '@/services/api/assignments.service';
import { Result, ResultStatus } from '@/types/result.types';
import { Patient } from '@/types/patient.types';
import { Test } from '@/types/test.types';
import { UserRole } from '@/types/user.types';
import { ResultTable } from '../ResultTable/ResultTable';
import { ResultFilters } from '../ResultFilters/ResultFilters';
import { ResultSearch } from '../ResultSearch/ResultSearch';
import { Pagination } from '@/components/common/Pagination/Pagination';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { useDebounce } from '@/hooks/useDebounce/useDebounce';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { Skeleton } from '@/components/common/Skeleton';
import { VerifyResultModal } from '../VerifyResultModal/VerifyResultModal';
import { calculateResultStatus } from '@/utils/result-helpers';

export const ResultList: React.FC = () => {
  const router = useRouter();
  const { addToast } = useUIStore();
  const { user } = useAuthStore();

  const [allResults, setAllResults] = useState<Result[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
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
  const [statusFilter, setStatusFilter] = useState<ResultStatus | undefined>();
  const [patientFilter, setPatientFilter] = useState<string | undefined>();
  const [testFilter, setTestFilter] = useState<string | undefined>();
  const [verifiedFilter, setVerifiedFilter] = useState<boolean | undefined>();
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Modals
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);

  // Fetch all results by fetching from all patients or assignments based on user role
  const fetchAllResults = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const isTechnician = user?.role === UserRole.TEST_TECHNICIAN || user?.role === UserRole.LAB_TECHNICIAN;

      if (isTechnician) {
        // For technicians: Fetch their assignments first, then results
        const myAssignments = await assignmentsService.getMyAssignments();

        // Fetch results for each assignment
        const resultsPromises = myAssignments.map((assignment) =>
          resultsService.getResultByAssignment(assignment.id).catch(() => null)
        );
        const resultsArray = await Promise.all(resultsPromises);
        const allResultsData = resultsArray.filter((result): result is Result => result !== null);

        // Extract unique patients from results for filter
        const uniquePatients = new Map<string, Patient>();
        allResultsData.forEach((result) => {
          if (result.patient && !uniquePatients.has(result.patient.id)) {
            uniquePatients.set(result.patient.id, result.patient);
          }
        });
        setPatients(Array.from(uniquePatients.values()));

        // Fetch test details for each result
        const resultsWithTests = await Promise.all(
          allResultsData.map(async (result) => {
            if (result.test?.id) {
              try {
                const testDetails = await testsService.getTestById(result.test.id);
                return { ...result, test: testDetails };
              } catch {
                return result;
              }
            }
            return result;
          })
        );

        setAllResults(resultsWithTests);
      } else {
        // For admins/receptionists: Keep current approach
        const patientsResponse = await patientsService.getPatients({ limit: 100 });
        const allPatients = patientsResponse.data;

        // Fetch results for each patient
        const resultsPromises = allPatients.map((patient) =>
          resultsService.getResultsByPatient(patient.id).catch(() => [])
        );
        const resultsArrays = await Promise.all(resultsPromises);
        const allResultsData = resultsArrays.flat();

        // Fetch test details for each result
        const resultsWithTests = await Promise.all(
          allResultsData.map(async (result) => {
            if (result.test?.id) {
              try {
                const testDetails = await testsService.getTestById(result.test.id);
                return { ...result, test: testDetails };
              } catch {
                return result;
              }
            }
            return result;
          })
        );

        setAllResults(resultsWithTests);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(getErrorMessage(apiError));
      addToast({
        type: 'error',
        message: 'Failed to load results',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFilterData = async () => {
    try {
      const isTechnician = user?.role === UserRole.TEST_TECHNICIAN || user?.role === UserRole.LAB_TECHNICIAN;

      // Fetch tests for filter (all users need this)
      try {
        const testsData = await testsService.getTests({ isActive: true });
        setTests(testsData);
      } catch (err) {
        // Silently fail - tests filter is optional
      }

      // Fetch patients for filter (only for non-technicians, as technicians get patients from their results)
      if (!isTechnician) {
        try {
          const patientsData = await patientsService.getPatients({ limit: 100 });
          setPatients(patientsData.data);
        } catch (err) {
          // Silently fail - patients filter is optional
        }
      }
      // For technicians, patients will be populated from their results in fetchAllResults
    } catch (err) {
      // Silently fail - filters are optional
    }
  };

  useEffect(() => {
    fetchAllResults();
    fetchFilterData();
  }, [user?.role]);

  // Filter and search results client-side
  const filteredResults = useMemo(() => {
    let filtered = [...allResults];

    // Apply search
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (result) =>
          result.patient?.name.toLowerCase().includes(searchLower) ||
          result.patient?.patientId.toLowerCase().includes(searchLower) ||
          result.test?.name.toLowerCase().includes(searchLower)
      );
    }

    // Apply filters
    if (statusFilter) {
      filtered = filtered.filter((result) => {
        if (!result.test) return false;
        const status = calculateResultStatus(result.resultValues, result.test);
        return status === statusFilter;
      });
    }
    if (patientFilter) {
      filtered = filtered.filter((result) => result.patient?.id === patientFilter);
    }
    if (testFilter) {
      filtered = filtered.filter((result) => result.test?.id === testFilter);
    }
    if (verifiedFilter !== undefined) {
      filtered = filtered.filter((result) => result.isVerified === verifiedFilter);
    }

    return filtered;
  }, [allResults, debouncedSearch, statusFilter, patientFilter, testFilter, verifiedFilter]);

  // Paginate filtered results
  const paginatedResults = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    return filteredResults.slice(start, end);
  }, [filteredResults, pagination.page, pagination.limit]);

  // Update pagination when filtered results change
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      total: filteredResults.length,
      totalPages: Math.ceil(filteredResults.length / prev.limit),
      page: Math.min(prev.page, Math.max(1, Math.ceil(filteredResults.length / prev.limit))),
    }));
  }, [filteredResults.length]);

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

  const handleStatusFilterChange = (status: ResultStatus | undefined) => {
    setStatusFilter(status);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePatientFilterChange = (patientId: string | undefined) => {
    setPatientFilter(patientId);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleTestFilterChange = (testId: string | undefined) => {
    setTestFilter(testId);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleVerifiedFilterChange = (verified: boolean | undefined) => {
    setVerifiedFilter(verified);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setStatusFilter(undefined);
    setPatientFilter(undefined);
    setTestFilter(undefined);
    setVerifiedFilter(undefined);
    setSearchQuery('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleEditClick = (result: Result) => {
    router.push(`/results/${result.id}/edit`);
  };

  const handleVerifyClick = (result: Result) => {
    setSelectedResult(result);
    setVerifyModalOpen(true);
  };

  const handleVerifySuccess = () => {
    setVerifyModalOpen(false);
    setSelectedResult(null);
    fetchAllResults();
  };

  if (error && !isLoading) {
    return (
      <ErrorState title="Failed to load results" message={error} onRetry={fetchAllResults} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Test Results
          </h1>
          <p className="text-muted-foreground mt-1">View and manage all test results</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <ResultSearch value={searchQuery} onChange={handleSearchChange} />
            </div>
            <ResultFilters
              statusFilter={statusFilter}
              onStatusFilterChange={handleStatusFilterChange}
              patientFilter={patientFilter}
              onPatientFilterChange={handlePatientFilterChange}
              testFilter={testFilter}
              onTestFilterChange={handleTestFilterChange}
              verifiedFilter={verifiedFilter}
              onVerifiedFilterChange={handleVerifiedFilterChange}
              patients={patients}
              tests={tests}
              onReset={handleResetFilters}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} height="h-12" />
              ))}
            </div>
          ) : paginatedResults.length === 0 ? (
            <EmptyState
              title="No results found"
              message="Try adjusting your search or filters to find what you're looking for."
              action={
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-input rounded-md hover:bg-accent"
                >
                  Clear Filters
                </button>
              }
            />
          ) : (
            <>
              <div className="rounded-md border">
                <ResultTable
                  results={paginatedResults}
                  tests={new Map(tests.map((t) => [t.id, t]))}
                  onEdit={handleEditClick}
                  onVerify={handleVerifyClick}
                />
              </div>
              {pagination.totalPages > 0 && (
                <div className="mt-4">
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

      {selectedResult && (
        <VerifyResultModal
          isOpen={verifyModalOpen}
          onClose={() => {
            setVerifyModalOpen(false);
            setSelectedResult(null);
          }}
          result={selectedResult}
          onSuccess={handleVerifySuccess}
        />
      )}
    </div>
  );
};

