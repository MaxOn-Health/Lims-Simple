'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { SampleView } from '@/components/blood-samples/SampleView/SampleView';
import { BloodSample } from '@/types/blood-sample.types';
import { bloodSamplesService } from '@/services/api/blood-samples.service';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';

export default function BloodSampleDetailPage() {
  const params = useParams();
  const sampleId = params.id as string;
  const { addToast } = useUIStore();

  const [sample, setSample] = useState<BloodSample | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSample = async () => {
      if (!sampleId) {
        setError('Sample ID is required');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await bloodSamplesService.getBloodSampleById(sampleId);
        setSample(data);
      } catch (err) {
        const apiError = err as ApiError;
        setError(getErrorMessage(apiError));
        addToast({
          type: 'error',
          message: 'Failed to load sample',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSample();
  }, [sampleId, addToast]);

  const handleUpdate = async () => {
    if (!sampleId) return;
    try {
      const data = await bloodSamplesService.getBloodSampleById(sampleId);
      setSample(data);
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError) || 'Failed to refresh sample',
      });
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0">
            <div className="space-y-6">
              <Skeleton height="h-10" />
              <Skeleton height="h-64" />
              <Skeleton height="h-64" />
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (error || !sample) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0">
            <ErrorState
              title="Failed to load sample"
              message={error || 'Sample not found'}
              onRetry={() => window.location.reload()}
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
          <SampleView sample={sample} onUpdate={handleUpdate} />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

