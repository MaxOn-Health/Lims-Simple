'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { resultsService } from '@/services/api/results.service';
import { testsService } from '@/services/api/tests.service';
import { Result, UpdateResultRequest } from '@/types/result.types';
import { Test } from '@/types/test.types';
import { DynamicResultForm } from '../DynamicResultForm/DynamicResultForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const ResultEditForm: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const resultId = params.id as string;
  const { addToast } = useUIStore();

  const [result, setResult] = useState<Result | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!resultId) {
        setError('Result ID is required');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [resultData, testData] = await Promise.all([
          resultsService.getResultById(resultId),
          Promise.resolve(null as Test | null),
        ]);

        setResult(resultData);

        // Fetch test details
        if (resultData.test?.id) {
          const testDetails = await testsService.getTestById(resultData.test.id);
          setTest(testDetails);
        } else if (resultData.assignment?.testId) {
          const testDetails = await testsService.getTestById(resultData.assignment.testId);
          setTest(testDetails);
        }

        // Check if result is verified
        if (resultData.isVerified) {
          setError('Cannot edit verified results');
        }
      } catch (err) {
        const apiError = err as ApiError;
        setError(getErrorMessage(apiError) || 'Failed to load result data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [resultId]);

  const handleSubmit = async (data: UpdateResultRequest) => {
    if (!resultId) {
      addToast({
        type: 'error',
        message: 'Result ID is required',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await resultsService.updateResult(resultId, data);

      addToast({
        type: 'success',
        message: 'Result updated successfully',
      });

      // Navigate to result detail page
      router.push(`/results/${resultId}`);
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError) || 'Failed to update result',
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

  if (!result || !test) {
    return (
      <ErrorState
        title="Data not found"
        message="Result or test data could not be loaded"
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Edit Test Result
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Update test result values for {test.name}</p>
      </div>

      {/* Status Warning */}
      {result.isVerified && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            This result has been verified and cannot be edited.
          </AlertDescription>
        </Alert>
      )}

      {/* Result Edit Form */}
      {!result.isVerified && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Result Values</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DynamicResultForm
              test={test}
              defaultValues={{
                resultValues: result.resultValues,
                notes: result.notes || '',
              }}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              mode="edit"
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

