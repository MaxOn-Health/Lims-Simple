'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { AssignmentView } from '@/components/assignments/AssignmentView/AssignmentView';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { assignmentsService } from '@/services/api/assignments.service';
import { Assignment } from '@/types/assignment.types';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!assignmentId) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await assignmentsService.getAssignmentById(assignmentId);
        setAssignment(data);
      } catch (err) {
        const apiError = err as ApiError;
        setError(getErrorMessage(apiError));
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignment();
  }, [assignmentId]);

  const handleUpdate = async () => {
    if (!assignmentId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await assignmentsService.getAssignmentById(assignmentId);
      setAssignment(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(getErrorMessage(apiError));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0">
            <div className="space-y-6">
              <Skeleton height="h-8" />
              <Skeleton height="h-64" />
              <Skeleton height="h-64" />
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0">
            <ErrorState
              title="Failed to load assignment"
              message={error}
              onRetry={() => {
                if (assignmentId) {
                  handleUpdate();
                }
              }}
            />
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (!assignment) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0">
            <ErrorState
              title="Assignment not found"
              message="The assignment you're looking for doesn't exist."
              onRetry={() => router.push('/assignments')}
            />
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="px-4 py-6 sm:px-0">
          <AssignmentView assignment={assignment} onUpdate={handleUpdate} />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

