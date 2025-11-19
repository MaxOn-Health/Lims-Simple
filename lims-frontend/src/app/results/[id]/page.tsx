'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { ResultView } from '@/components/results/ResultView/ResultView';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { resultsService } from '@/services/api/results.service';
import { testsService } from '@/services/api/tests.service';
import { Result } from '@/types/result.types';
import { Test } from '@/types/test.types';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';

export default function ResultDetailPage() {
  const params = useParams();
  const resultId = params.id as string;

  const [result, setResult] = useState<Result | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      if (!resultId) return;

      setIsLoading(true);
      setError(null);

      try {
        const resultData = await resultsService.getResultById(resultId);
        setResult(resultData);

        // Fetch test details
        if (resultData.test?.id) {
          const testDetails = await testsService.getTestById(resultData.test.id);
          setTest(testDetails);
        } else if (resultData.assignment?.testId) {
          const testDetails = await testsService.getTestById(resultData.assignment.testId);
          setTest(testDetails);
        }
      } catch (err) {
        const apiError = err as ApiError;
        setError(getErrorMessage(apiError));
      } finally {
        setIsLoading(false);
      }
    };

    fetchResult();
  }, [resultId]);

  const handleUpdate = async () => {
    if (!resultId) return;

    setIsLoading(true);
    setError(null);

    try {
      const resultData = await resultsService.getResultById(resultId);
      setResult(resultData);

      // Fetch test details
      if (resultData.test?.id) {
        const testDetails = await testsService.getTestById(resultData.test.id);
        setTest(testDetails);
      } else if (resultData.assignment?.testId) {
        const testDetails = await testsService.getTestById(resultData.assignment.testId);
        setTest(testDetails);
      }
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
              title="Failed to load result"
              message={error}
              onRetry={() => {
                if (resultId) {
                  handleUpdate();
                }
              }}
            />
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (!result) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0">
            <ErrorState
              title="Result not found"
              message="The result you're looking for doesn't exist."
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
          {test ? (
            <ResultView result={result} test={test} onUpdate={handleUpdate} />
          ) : (
            <ErrorState
              title="Test information not available"
              message="Unable to load test details for this result."
            />
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

