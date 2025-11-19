'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { assignmentsService } from '@/services/api/assignments.service';
import { Assignment, AssignmentStatus } from '@/types/assignment.types';
import { AssignmentCard } from '../AssignmentCard/AssignmentCard';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/common/Button/Button';
import { AssignmentStatusBadge } from '../AssignmentStatusBadge/AssignmentStatusBadge';
import { Skeleton } from '@/components/common/Skeleton';
import { ClipboardList, Play, CheckCircle, FileText, Search, User } from 'lucide-react';
import { UpdateStatusModal } from '../UpdateStatusModal/UpdateStatusModal';
import { useDebounce } from '@/hooks/useDebounce/useDebounce';

export const MyAssignmentsDashboard: React.FC = () => {
  const router = useRouter();
  const { addToast } = useUIStore();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updateStatusModalOpen, setUpdateStatusModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const fetchAssignments = async (status?: AssignmentStatus) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await assignmentsService.getMyAssignments(status);
      setAssignments(data);
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

  useEffect(() => {
    const status =
      selectedStatus === 'all'
        ? undefined
        : (selectedStatus as AssignmentStatus);
    fetchAssignments(status);
  }, [selectedStatus]);

  // Filter assignments by search query
  const filteredAssignments = useMemo(() => {
    if (!debouncedSearchQuery) return assignments;
    
    const query = debouncedSearchQuery.toLowerCase();
    return assignments.filter((assignment) => {
      const patientName = assignment.patient?.name?.toLowerCase() || '';
      const patientId = assignment.patient?.patientId?.toLowerCase() || '';
      const testName = assignment.test?.name?.toLowerCase() || '';
      
      return patientName.includes(query) || patientId.includes(query) || testName.includes(query);
    });
  }, [assignments, debouncedSearchQuery]);

  // Get unique patients count
  const uniquePatients = useMemo(() => {
    const patientIds = new Set<string>();
    assignments.forEach((assignment) => {
      if (assignment.patient?.id) {
        patientIds.add(assignment.patient.id);
      }
    });
    return patientIds.size;
  }, [assignments]);

  const statistics = useMemo(() => {
    const allAssignments = filteredAssignments;
    const total = allAssignments.length;
    const byStatus = {
      [AssignmentStatus.ASSIGNED]: allAssignments.filter(
        (a) => a.status === AssignmentStatus.ASSIGNED
      ).length,
      [AssignmentStatus.IN_PROGRESS]: allAssignments.filter(
        (a) => a.status === AssignmentStatus.IN_PROGRESS
      ).length,
      [AssignmentStatus.COMPLETED]: allAssignments.filter(
        (a) => a.status === AssignmentStatus.COMPLETED
      ).length,
      [AssignmentStatus.SUBMITTED]: allAssignments.filter(
        (a) => a.status === AssignmentStatus.SUBMITTED
      ).length,
    };
    const completedCount =
      byStatus[AssignmentStatus.COMPLETED] + byStatus[AssignmentStatus.SUBMITTED];
    const completionRate =
      total > 0 ? Math.round((completedCount / total) * 100) : 0;

    return {
      total,
      byStatus,
      completionRate,
      uniquePatients,
    };
  }, [filteredAssignments, uniquePatients]);

  const handleStart = (assignmentId: string) => {
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (assignment) {
      setSelectedAssignment(assignment);
      // Pre-set status to IN_PROGRESS
      setUpdateStatusModalOpen(true);
    }
  };

  const handleComplete = (assignmentId: string) => {
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (assignment) {
      setSelectedAssignment(assignment);
      // Pre-set status to COMPLETED
      setUpdateStatusModalOpen(true);
    }
  };

  const handleStatusUpdate = () => {
    setUpdateStatusModalOpen(false);
    setSelectedAssignment(null);
    fetchAssignments(
      selectedStatus === 'all' ? undefined : (selectedStatus as AssignmentStatus)
    );
  };

  const handleUpdateStatus = (assignmentId: string) => {
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (assignment) {
      setSelectedAssignment(assignment);
      setUpdateStatusModalOpen(true);
    }
  };

  if (error && !isLoading) {
    return (
      <ErrorState
        title="Failed to load assignments"
        message={error}
        onRetry={() =>
          fetchAssignments(
            selectedStatus === 'all' ? undefined : (selectedStatus as AssignmentStatus)
          )
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardList className="h-8 w-8 text-primary" />
          My Assignments
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your assigned tests and track their progress
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <User className="h-4 w-4" />
              Total Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.uniquePatients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.byStatus[AssignmentStatus.ASSIGNED]}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.byStatus[AssignmentStatus.IN_PROGRESS]}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.completionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Search/Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Search Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by patient name, patient ID, or test name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchQuery && (
            <div className="mt-2 text-sm text-muted-foreground">
              Showing {filteredAssignments.length} of {assignments.length} assignments
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Tabs */}
      <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value={AssignmentStatus.ASSIGNED}>Assigned</TabsTrigger>
          <TabsTrigger value={AssignmentStatus.IN_PROGRESS}>In Progress</TabsTrigger>
          <TabsTrigger value={AssignmentStatus.COMPLETED}>Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedStatus} className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton height="h-6" />
                    <Skeleton height="h-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton height="h-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <EmptyState
              title="No assignments found"
              message={
                searchQuery
                  ? `No assignments found matching "${searchQuery}". Try adjusting your search.`
                  : selectedStatus === 'all'
                  ? "You don't have any assignments yet."
                  : `You don't have any ${selectedStatus.toLowerCase()} assignments.`
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAssignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onStart={handleStart}
                  onComplete={handleComplete}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedAssignment && (
        <UpdateStatusModal
          isOpen={updateStatusModalOpen}
          onClose={() => {
            setUpdateStatusModalOpen(false);
            setSelectedAssignment(null);
          }}
          assignment={selectedAssignment}
          onSuccess={handleStatusUpdate}
        />
      )}
    </div>
  );
};

