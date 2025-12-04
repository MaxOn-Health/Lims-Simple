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

  const fetchAssignments = async (status?: AssignmentStatus | 'completed') => {
    setIsLoading(true);
    setError(null);

    try {
      // Handle special case for "completed" tab - fetch all assignments and filter client-side
      if (status === 'completed') {
        const allData = await assignmentsService.getMyAssignments(undefined);
        setAssignments(allData);
      } else {
        const data = await assignmentsService.getMyAssignments(status);
        setAssignments(data);
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

  useEffect(() => {
    const status =
      selectedStatus === 'all'
        ? undefined
        : selectedStatus === 'completed'
        ? 'completed'
        : (selectedStatus as AssignmentStatus);
    fetchAssignments(status);
  }, [selectedStatus]);

  // Filter assignments by search query and status tab
  const filteredAssignments = useMemo(() => {
    let filtered = assignments;

    // Apply status filter for "completed" tab (show both COMPLETED and SUBMITTED)
    if (selectedStatus === 'completed') {
      filtered = filtered.filter(
        (assignment) =>
          assignment.status === AssignmentStatus.COMPLETED ||
          assignment.status === AssignmentStatus.SUBMITTED
      );
    }

    // Apply search query filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter((assignment) => {
        const patientName = assignment.patient?.name?.toLowerCase() || '';
        const patientId = assignment.patient?.patientId?.toLowerCase() || '';
        const testName = assignment.test?.name?.toLowerCase() || '';

        return patientName.includes(query) || patientId.includes(query) || testName.includes(query);
      });
    }

    return filtered;
  }, [assignments, debouncedSearchQuery, selectedStatus]);

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
        selectedStatus === 'all'
          ? undefined
          : selectedStatus === 'completed'
          ? 'completed'
          : (selectedStatus as AssignmentStatus)
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
            selectedStatus === 'all'
              ? undefined
              : selectedStatus === 'completed'
              ? 'completed'
              : (selectedStatus as AssignmentStatus)
          )
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-gray-900">
            <ClipboardList className="h-8 w-8 text-primary" />
            My Tasks
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Hello! Here are the tests assigned to you today.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
          {/* Quick status filter could go here if needed, but tabs cover it */}
        </div>
      </div>

      {/* Simplified Statistics - Focus on Actionable Numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-100 shadow-sm">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-bold text-blue-700 mb-1">
              {statistics.byStatus[AssignmentStatus.ASSIGNED] + statistics.byStatus[AssignmentStatus.IN_PROGRESS]}
            </span>
            <span className="text-sm font-medium text-blue-600 uppercase tracking-wider">Pending Tasks</span>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-100 shadow-sm">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-bold text-green-700 mb-1">
              {statistics.byStatus[AssignmentStatus.COMPLETED] + statistics.byStatus[AssignmentStatus.SUBMITTED]}
            </span>
            <span className="text-sm font-medium text-green-600 uppercase tracking-wider">Completed</span>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-gray-100 shadow-sm hidden sm:block">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-bold text-gray-700 mb-1">
              {statistics.total}
            </span>
            <span className="text-sm font-medium text-gray-600 uppercase tracking-wider">Total Assigned</span>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-100 shadow-sm hidden sm:block">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-bold text-purple-700 mb-1">
              {statistics.completionRate}%
            </span>
            <span className="text-sm font-medium text-purple-600 uppercase tracking-wider">Completion Rate</span>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Find a patient or test..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg shadow-sm"
            />
          </div>
        </div>

        {/* Tabs for Status */}
        <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="w-full">
          <TabsList className="w-full justify-start h-12 bg-muted/50 p-1 gap-1 overflow-x-auto">
            <TabsTrigger value="all" className="flex-1 min-w-[80px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
              All
            </TabsTrigger>
            <TabsTrigger value={AssignmentStatus.ASSIGNED} className="flex-1 min-w-[100px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
              To Start
            </TabsTrigger>
            <TabsTrigger value={AssignmentStatus.IN_PROGRESS} className="flex-1 min-w-[100px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
              In Progress
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 min-w-[100px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Completed
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedStatus} className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="border-none shadow-md">
                    <CardHeader>
                      <Skeleton height="h-6" width="w-3/4" />
                      <Skeleton height="h-4" width="w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton height="h-24" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : assignments.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  title="No tasks found"
                  message={
                    searchQuery
                      ? `No tasks found matching "${searchQuery}".`
                      : selectedStatus === 'all'
                        ? "You have no tasks assigned at the moment."
                        : selectedStatus === 'completed'
                        ? "You have no completed tasks yet."
                        : `You have no ${selectedStatus.toLowerCase().replace('_', ' ')} tasks.`
                  }
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
      </div>

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

