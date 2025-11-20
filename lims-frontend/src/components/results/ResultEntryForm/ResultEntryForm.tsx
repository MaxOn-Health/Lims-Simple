'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { assignmentsService } from '@/services/api/assignments.service';
import { testsService } from '@/services/api/tests.service';
import { resultsService } from '@/services/api/results.service';
import { Assignment, AssignmentStatus } from '@/types/assignment.types';
import { Test } from '@/types/test.types';
import { SubmitResultRequest } from '@/types/result.types';
import { DynamicResultForm } from '../DynamicResultForm/DynamicResultForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { FileText, User, FlaskConical, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const ResultEntryForm: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.assignmentId as string;
  const { addToast } = useUIStore();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!assignmentId) {
        setError('Assignment ID is required');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [assignmentData, testData] = await Promise.all([
          assignmentsService.getAssignmentById(assignmentId),
          // We'll get test from assignment.testId
          Promise.resolve(null as Test | null),
        ]);

        setAssignment(assignmentData);

        // Fetch test details
        if (assignmentData.testId) {
          const testDetails = await testsService.getTestById(assignmentData.testId);
          setTest(testDetails);
        }

        // Ensure assignment is in a state that allows result entry
        if (
          assignmentData.status !== AssignmentStatus.IN_PROGRESS &&
          assignmentData.status !== AssignmentStatus.ASSIGNED
        ) {
          setError(
            `Cannot submit results. Assignment must be IN_PROGRESS or ASSIGNED. Current status: ${assignmentData.status}`
          );
        }
      } catch (err) {
        const apiError = err as ApiError;
        setError(getErrorMessage(apiError) || 'Failed to load assignment or test data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [assignmentId]);

  const handleSubmit = async (data: SubmitResultRequest) => {
    if (!assignmentId) {
      addToast({
        type: 'error',
        message: 'Assignment ID is required',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await resultsService.submitResult({
        ...data,
        assignmentId,
      });

      addToast({
        type: 'success',
        message: 'Result submitted successfully',
      });

      // Navigate to assignment detail or results page
      router.push(`/assignments/${assignmentId}`);
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError) || 'Failed to submit result',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton height="h-10" />
        <Skeleton height="h-64" />
        <Skeleton height="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load data"
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!assignment || !test) {
    return (
      <ErrorState
        title="Data not found"
        message="Assignment or test data could not be loaded"
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-8 w-8 text-primary" />
          Submit Test Result
        </h1>
        <p className="text-muted-foreground mt-1">
          Enter test results for {test.name}
        </p>
      </div>

      {/* Patient Information - Prominent */}
      {assignment.patient && (
        <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Patient Information
            </CardTitle>
        </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {assignment.patient.name}
                </p>
                <p className="text-sm text-muted-foreground font-mono mt-0.5">
                  {assignment.patient.patientId}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Test Information
          </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FlaskConical className="h-5 w-5 text-primary" />
            </div>
              <div>
              <p className="text-sm font-medium text-muted-foreground">Test Name</p>
                <p className="text-base font-semibold">{test.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Warning */}
      {assignment.status !== AssignmentStatus.IN_PROGRESS &&
        assignment.status !== AssignmentStatus.ASSIGNED && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Cannot submit results. Assignment must be IN_PROGRESS or ASSIGNED. Current status:{' '}
            {assignment.status}
          </AlertDescription>
        </Alert>
      )}

      {/* Result Entry Form */}
      {(assignment.status === AssignmentStatus.IN_PROGRESS || assignment.status === AssignmentStatus.ASSIGNED) && (
        <Card>
          <CardHeader>
            <CardTitle>Result Values</CardTitle>
          </CardHeader>
          <CardContent>
            <DynamicResultForm
              test={test}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              mode="create"
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

