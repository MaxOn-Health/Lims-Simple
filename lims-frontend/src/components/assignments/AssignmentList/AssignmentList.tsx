'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { assignmentsService } from '@/services/api/assignments.service';
import { patientsService } from '@/services/api/patients.service';
import { testsService } from '@/services/api/tests.service';
import { usersService } from '@/services/api/users.service';
import { Assignment, AssignmentStatus } from '@/types/assignment.types';
import { Patient } from '@/types/patient.types';
import { Test } from '@/types/test.types';
import { User, UserRole } from '@/types/user.types';
import { AssignmentTable } from '../AssignmentTable/AssignmentTable';
import { AssignmentFilters } from '../AssignmentFilters/AssignmentFilters';
import { AssignmentSearch } from '../AssignmentSearch/AssignmentSearch';
import { Pagination } from '@/components/common/Pagination/Pagination';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { Button } from '@/components/common/Button/Button';
import { useDebounce } from '@/hooks/useDebounce/useDebounce';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { HasRole } from '@/components/common/HasRole/HasRole';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plus, ClipboardList } from 'lucide-react';
import { Skeleton } from '@/components/common/Skeleton';
import { ReassignModal } from '../ReassignModal/ReassignModal';
import { UpdateStatusModal } from '../UpdateStatusModal/UpdateStatusModal';
import { useAuthStore } from '@/store/auth.store';

export const AssignmentList: React.FC = () => {
  const router = useRouter();
  const { addToast } = useUIStore();
  const { user } = useAuthStore();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
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
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | undefined>();
  const [patientFilter, setPatientFilter] = useState<string | undefined>();
  const [testFilter, setTestFilter] = useState<string | undefined>();
  const [adminFilter, setAdminFilter] = useState<string | undefined>();
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Modals
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [updateStatusModalOpen, setUpdateStatusModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  // Filter and search assignments client-side
  const filteredAssignments = useMemo(() => {
    let filtered = [...allAssignments];

    // Apply search
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (assignment) =>
          assignment.patient?.name.toLowerCase().includes(searchLower) ||
          assignment.patient?.patientId.toLowerCase().includes(searchLower) ||
          assignment.test?.name.toLowerCase().includes(searchLower)
      );
    }

    // Apply filters
    if (statusFilter) {
      filtered = filtered.filter((assignment) => assignment.status === statusFilter);
    }
    if (patientFilter) {
      filtered = filtered.filter((assignment) => assignment.patientId === patientFilter);
    }
    if (testFilter) {
      filtered = filtered.filter((assignment) => assignment.testId === testFilter);
    }
    if (adminFilter) {
      filtered = filtered.filter((assignment) => assignment.adminId === adminFilter);
    }

    return filtered;
  }, [allAssignments, debouncedSearch, statusFilter, patientFilter, testFilter, adminFilter]);

  // Paginate filtered assignments
  const paginatedAssignments = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    return filteredAssignments.slice(start, end);
  }, [filteredAssignments, pagination.page, pagination.limit]);

  // Update pagination when filtered results change
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      total: filteredAssignments.length,
      totalPages: Math.ceil(filteredAssignments.length / prev.limit),
      page: Math.min(prev.page, Math.max(1, Math.ceil(filteredAssignments.length / prev.limit))),
    }));
  }, [filteredAssignments.length]);

  const fetchAssignments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if user is a technician (TEST_TECHNICIAN or LAB_TECHNICIAN)
      const isTechnician = user?.role === UserRole.TEST_TECHNICIAN || user?.role === UserRole.LAB_TECHNICIAN;

      if (isTechnician) {
        // Use my-assignments endpoint for technicians
        const data = await assignmentsService.getMyAssignments(statusFilter);
        setAllAssignments(data);
      } else {
        // Use getAllAssignments for admins/receptionists
        try {
          const data = await assignmentsService.getAllAssignments({
            status: statusFilter,
            patientId: patientFilter,
            adminId: adminFilter,
            testId: testFilter,
          });
          setAllAssignments(data);
        } catch (err: any) {
          // If endpoint doesn't exist (404), fetch from multiple sources
          if (err?.response?.status === 404) {
            // For now, set empty array - will be populated when backend endpoint is added
            setAllAssignments([]);
          } else {
            throw err;
          }
        }
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(getErrorMessage(apiError));
      addToast({
        type: 'error',
        message: 'Failed to load assignments',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFilterData = async () => {
    try {
      // Check if user is a technician - technicians don't need all filter data
      const isTechnician = user?.role === UserRole.TEST_TECHNICIAN || user?.role === UserRole.LAB_TECHNICIAN;

      // Fetch patients for filter (if not technician, as technicians only see their own assignments)
      if (!isTechnician) {
        try {
          const patientsData = await patientsService.getPatients({ limit: 100 });
          setPatients(patientsData.data);
        } catch (err) {
          // Silently fail - patients filter is optional
        }
      }

      // Fetch tests for filter
      try {
        const testsData = await testsService.getTests({ isActive: true });
        setTests(testsData);
      } catch (err) {
        // Silently fail - tests filter is optional
      }

      // Fetch admins for filter (TEST_TECHNICIAN and LAB_TECHNICIAN roles) - only for non-technicians
      if (!isTechnician) {
        try {
          const adminsData = await usersService.getUsers({ limit: 100, role: UserRole.TEST_TECHNICIAN });
          const labTechsData = await usersService.getUsers({
            limit: 100,
            role: UserRole.LAB_TECHNICIAN,
          });
          setAdmins([...adminsData.data, ...labTechsData.data]);
        } catch (err) {
          // Silently fail - admin filter is optional
        }
      }
    } catch (err) {
      // Silently fail - filter data is optional
    }
  };

  useEffect(() => {
    fetchFilterData();
  }, [user?.role]);

  useEffect(() => {
    fetchAssignments();
  }, [statusFilter, patientFilter, testFilter, adminFilter, user?.role]);

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

  const handleStatusFilterChange = (status: AssignmentStatus | undefined) => {
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

  const handleAdminFilterChange = (adminId: string | undefined) => {
    setAdminFilter(adminId);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setStatusFilter(undefined);
    setPatientFilter(undefined);
    setTestFilter(undefined);
    setAdminFilter(undefined);
    setSearchQuery('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleReassignClick = (assignmentId: string) => {
    const assignment = allAssignments.find((a) => a.id === assignmentId);
    if (assignment) {
      setSelectedAssignment(assignment);
      setReassignModalOpen(true);
    }
  };

  const handleUpdateStatusClick = (assignmentId: string) => {
    const assignment = allAssignments.find((a) => a.id === assignmentId);
    if (assignment) {
      setSelectedAssignment(assignment);
      setUpdateStatusModalOpen(true);
    }
  };

  const handleAssignmentUpdate = () => {
    fetchAssignments();
  };

  if (error && !isLoading) {
    return (
      <ErrorState
        title="Failed to load assignments"
        message={error}
        onRetry={fetchAssignments}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Simplified Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Pending Tests
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            View and assign test orders to technicians.
          </p>
        </div>
        <div className="flex gap-3">
          <HasRole allowedRoles={[UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN]}>
            <Button
              variant="primary"
              onClick={() => router.push('/assignments/manual-assign')}
              size="lg"
              className="shadow-md shadow-primary/20"
            >
              <Plus className="mr-2 h-5 w-5" />
              Assign New Test
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/assignments/auto-assign')}
              size="lg"
              className="hidden md:flex"
            >
              Auto Assign
            </Button>
          </HasRole>
        </div>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader className="bg-gray-50/50 border-b pb-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="flex-1 max-w-md">
              <AssignmentSearch value={searchQuery} onChange={handleSearchChange} />
            </div>

            {/* Simple Filter Toggle (could be expanded, but keeping it clean for now) */}
            <div className="flex items-center gap-2">
              {/* We can add a 'Filter' button here later if needed to toggle the advanced filters */}
            </div>
          </div>

          {/* Advanced Filters - Visible but styled to be less intrusive */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <AssignmentFilters
              statusFilter={statusFilter}
              onStatusFilterChange={handleStatusFilterChange}
              patientFilter={patientFilter}
              onPatientFilterChange={handlePatientFilterChange}
              testFilter={testFilter}
              onTestFilterChange={handleTestFilterChange}
              adminFilter={adminFilter}
              onAdminFilterChange={handleAdminFilterChange}
              patients={patients}
              tests={tests}
              admins={admins}
              onReset={handleResetFilters}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} height="h-16" className="rounded-lg" />
              ))}
            </div>
          ) : paginatedAssignments.length === 0 ? (
            <div className="p-12">
              <EmptyState
                title="No pending tests found"
                message="Great job! All test orders have been processed or none match your search."
                action={
                  <Button variant="outline" onClick={handleResetFilters}>
                    Clear Search
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <div className="border-t border-gray-100">
                <AssignmentTable
                  assignments={paginatedAssignments}
                  onReassign={handleReassignClick}
                  onUpdateStatus={handleUpdateStatusClick}
                />
              </div>
              {pagination.totalPages > 0 && (
                <div className="p-4 border-t border-gray-100 bg-gray-50/30">
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

      {selectedAssignment && (
        <>
          <ReassignModal
            isOpen={reassignModalOpen}
            onClose={() => {
              setReassignModalOpen(false);
              setSelectedAssignment(null);
            }}
            assignment={selectedAssignment}
            onSuccess={handleAssignmentUpdate}
          />
          <UpdateStatusModal
            isOpen={updateStatusModalOpen}
            onClose={() => {
              setUpdateStatusModalOpen(false);
              setSelectedAssignment(null);
            }}
            assignment={selectedAssignment}
            onSuccess={handleAssignmentUpdate}
          />
        </>
      )}
    </div>
  );
};

