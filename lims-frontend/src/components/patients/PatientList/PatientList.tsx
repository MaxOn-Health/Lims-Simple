'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { patientsService } from '@/services/api/patients.service';
import { packagesService } from '@/services/api/packages.service';
import { Patient, PaymentStatus, QueryPatientsParams } from '@/types/patient.types';
import { PaginatedPatientsResponse } from '@/types/patient.types';
import { Package } from '@/types/package.types';
import { PatientTable } from '../PatientTable/PatientTable';
import { PatientFilters } from '../PatientFilters/PatientFilters';
import { PatientSearch } from '../PatientSearch/PatientSearch';
import { Pagination } from '@/components/common/Pagination/Pagination';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { Button } from '@/components/common/Button/Button';
import { useDebounce } from '@/hooks/useDebounce/useDebounce';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { HasRole } from '@/components/common/HasRole/HasRole';
import { UserRole } from '@/types/user.types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plus, Users as UsersIcon } from 'lucide-react';
import { UpdatePaymentModal } from '../UpdatePaymentModal/UpdatePaymentModal';
import { Skeleton } from '@/components/common/Skeleton';
import { useProjectFilter } from '@/hooks/useProjectFilter';
import { ProjectSelector } from '@/components/common/ProjectSelector/ProjectSelector';

// Memoized table component
const MemoizedPatientTable = React.memo(PatientTable);

export const PatientList: React.FC = () => {
  const router = useRouter();
  const { addToast } = useUIStore();
  const {
    selectedProjectId,
    setSelectedProjectId,
    userProjects,
    isSuperAdmin,
    hasMultipleProjects,
    isLoading: isProjectsLoading,
  } = useProjectFilter();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
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
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | undefined>();
  const [dateFromFilter, setDateFromFilter] = useState<string | undefined>();
  const [dateToFilter, setDateToFilter] = useState<string | undefined>();
  const [packageFilter, setPackageFilter] = useState<string | undefined>();
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Payment modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [patientForPayment, setPatientForPayment] = useState<Patient | null>(null);

  // Memoize query params to prevent unnecessary re-renders
  const queryParams = useMemo((): QueryPatientsParams => ({
    page: pagination.page,
    limit: pagination.limit,
    search: debouncedSearch || undefined,
    paymentStatus: paymentStatusFilter,
    dateFrom: dateFromFilter,
    dateTo: dateToFilter,
    packageId: packageFilter,
    projectId: selectedProjectId || undefined,
  }), [pagination.page, pagination.limit, debouncedSearch, paymentStatusFilter, dateFromFilter, dateToFilter, packageFilter, selectedProjectId]);

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response: PaginatedPatientsResponse = await patientsService.getPatients(queryParams);

      setPatients(response.data);
      setPagination(prev => ({
        ...prev,
        page: response.meta.page,
        total: response.meta.total,
        totalPages: response.meta.totalPages,
      }));
    } catch (err) {
      const apiError = err as ApiError;
      setError(getErrorMessage(apiError));
      addToast({
        type: 'error',
        message: 'Failed to load patients',
      });
    } finally {
      setIsLoading(false);
    }
  }, [queryParams, addToast]);

  // Fetch packages only once
  useEffect(() => {
    let mounted = true;
    packagesService.getPackages({ isActive: true })
      .then(data => {
        if (mounted) setPackages(data);
      })
      .catch(() => {
        // Silently fail - packages filter is optional
      });
    return () => { mounted = false; };
  }, []);

  // Fetch patients when query params change
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Memoized handlers to prevent child re-renders
  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const handleItemsPerPageChange = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handlePaymentStatusFilterChange = useCallback((status: PaymentStatus | undefined) => {
    setPaymentStatusFilter(status);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleDateFromFilterChange = useCallback((date: string | undefined) => {
    setDateFromFilter(date);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleDateToFilterChange = useCallback((date: string | undefined) => {
    setDateToFilter(date);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handlePackageFilterChange = useCallback((packageId: string | undefined) => {
    setPackageFilter(packageId);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setPaymentStatusFilter(undefined);
    setDateFromFilter(undefined);
    setDateToFilter(undefined);
    setPackageFilter(undefined);
    setSearchQuery('');
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleUpdatePaymentClick = useCallback((patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      setPatientForPayment(patient);
      setPaymentModalOpen(true);
    }
  }, [patients]);

  const handleClosePaymentModal = useCallback(() => {
    setPaymentModalOpen(false);
    setPatientForPayment(null);
  }, []);

  const handleRegisterClick = useCallback(() => {
    router.push('/patients/new');
  }, [router]);

  if (error && !isLoading) {
    return (
      <ErrorState
        title="Failed to load patients"
        message={error}
        onRetry={fetchPatients}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UsersIcon className="h-8 w-8 text-primary" />
            Patients
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage patient records and registrations
          </p>
        </div>
        <HasRole allowedRoles={[UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN]}>
          <Button
            variant="primary"
            onClick={handleRegisterClick}
            size="default"
          >
            <Plus className="mr-2 h-4 w-4" />
            Register Patient
          </Button>
        </HasRole>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            {/* Project Filter - show for users with multiple projects or super admin */}
            {(hasMultipleProjects || isSuperAdmin) && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Project:</span>
                <ProjectSelector
                  selectedProjectId={selectedProjectId}
                  onSelect={setSelectedProjectId}
                  projects={userProjects}
                  showAllOption={isSuperAdmin}
                  className="w-72"
                  size="sm"
                />
              </div>
            )}
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex-1">
                <PatientSearch value={searchQuery} onChange={handleSearchChange} />
              </div>
              <PatientFilters
                paymentStatusFilter={paymentStatusFilter}
                onPaymentStatusFilterChange={handlePaymentStatusFilterChange}
                dateFromFilter={dateFromFilter}
                onDateFromFilterChange={handleDateFromFilterChange}
                dateToFilter={dateToFilter}
                onDateToFilterChange={handleDateToFilterChange}
                packageFilter={packageFilter}
                onPackageFilterChange={handlePackageFilterChange}
                packages={packages}
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
          ) : patients.length === 0 ? (
            <EmptyState
              title="No patients found"
              message="Try adjusting your search or filters to find what you're looking for."
              action={
                <HasRole allowedRoles={[UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN]}>
                  <Button variant="outline" onClick={handleResetFilters}>
                    Clear Filters
                  </Button>
                </HasRole>
              }
            />
          ) : (
            <>
              <div className="rounded-md border">
                <MemoizedPatientTable
                  patients={patients}
                  onUpdatePayment={handleUpdatePaymentClick}
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

      {patientForPayment && (
        <UpdatePaymentModal
          isOpen={paymentModalOpen}
          onClose={handleClosePaymentModal}
          patient={patientForPayment}
          onSuccess={fetchPatients}
        />
      )}
    </div>
  );
};
