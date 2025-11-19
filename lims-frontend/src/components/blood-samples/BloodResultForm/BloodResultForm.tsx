'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { bloodSamplesService } from '@/services/api/blood-samples.service';
import { assignmentsService } from '@/services/api/assignments.service';
import { testsService } from '@/services/api/tests.service';
import { BloodSample } from '@/types/blood-sample.types';
import { Assignment } from '@/types/assignment.types';
import { Test } from '@/types/test.types';
import { SubmitBloodTestResultRequest } from '@/types/blood-sample.types';
import { DynamicResultForm } from '@/components/results/DynamicResultForm/DynamicResultForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { FileText, User, FlaskConical, AlertCircle, Droplet } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { canSubmitResult } from '@/utils/blood-sample-helpers';

export const BloodResultForm: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const sampleId = params.id as string;
  const { addToast } = useUIStore();

  const [sample, setSample] = useState<BloodSample | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!sampleId) {
        setError('Sample ID is required');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const sampleData = await bloodSamplesService.getBloodSampleById(sampleId);
        setSample(sampleData);

        // Check if sample can have results submitted
        if (!canSubmitResult(sampleData.status)) {
          setError(
            `Cannot submit results. Sample status must be IN_LAB or TESTED. Current status: ${sampleData.status}`
          );
          setIsLoading(false);
          return;
        }

        // Fetch assignment if available
        if (sampleData.assignmentId) {
          try {
            const assignmentData = await assignmentsService.getAssignmentById(sampleData.assignmentId);
            setAssignment(assignmentData);

            // Fetch test details
            if (assignmentData.testId) {
              const testDetails = await testsService.getTestById(assignmentData.testId);
              setTest(testDetails);
            }
          } catch (err) {
            // Assignment might not exist, continue without it
            console.warn('Failed to fetch assignment:', err);
          }
        } else {
          setError('Sample does not have an associated assignment');
        }
      } catch (err) {
        const apiError = err as ApiError;
        setError(getErrorMessage(apiError) || 'Failed to load sample data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sampleId]);

  const handleSubmit = async (data: { resultValues: Record<string, any>; notes?: string }) => {
    if (!sampleId) {
      addToast({
        type: 'error',
        message: 'Sample ID is required',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData: SubmitBloodTestResultRequest = {
        resultValues: data.resultValues,
        notes: data.notes,
      };

      await bloodSamplesService.submitBloodTestResult(sampleId, submitData);

      addToast({
        type: 'success',
        message: 'Blood test result submitted successfully',
      });

      // Navigate to sample detail view
      router.push(`/blood-samples/${sampleId}`);
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

  if (!sample || !test) {
    return (
      <ErrorState
        title="Data not found"
        message="Sample or test data could not be loaded"
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Droplet className="h-8 w-8 text-primary" />
          Submit Blood Test Result
        </h1>
        <p className="text-muted-foreground mt-1">
          Enter test results for {test.name}
        </p>
      </div>

      {/* Sample and Test Information */}
      <Card>
        <CardHeader>
          <CardTitle>Sample & Test Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Droplet className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sample ID</p>
                <p className="text-base font-mono font-semibold">{sample.sampleId}</p>
              </div>
            </div>
            {sample.patient && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Patient</p>
                  <p className="text-base font-semibold">
                    {sample.patient.name} ({sample.patient.patientId})
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <FlaskConical className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Test</p>
                <p className="text-base font-semibold">{test.name}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Warning */}
      {!canSubmitResult(sample.status) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Cannot submit results. Sample status must be IN_LAB or TESTED. Current status:{' '}
            {sample.status}
          </AlertDescription>
        </Alert>
      )}

      {/* Result Entry Form */}
      {canSubmitResult(sample.status) && (
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

