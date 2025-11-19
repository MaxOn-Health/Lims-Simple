'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { bloodSamplesService } from '@/services/api/blood-samples.service';
import { BloodSample, BloodSampleStatus } from '@/types/blood-sample.types';
import { SampleCard } from '../SampleCard/SampleCard';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/common/Button/Button';
import { Skeleton } from '@/components/common/Skeleton';
import { FlaskConical, Key, Eye, Plus } from 'lucide-react';
import { format, isToday } from 'date-fns';

export const LabTechDashboard: React.FC = () => {
  const router = useRouter();
  const { addToast } = useUIStore();

  const [samples, setSamples] = useState<BloodSample[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const fetchSamples = async (status?: BloodSampleStatus) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await bloodSamplesService.getMySamples(status);
      setSamples(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(getErrorMessage(apiError));
      addToast({
        type: 'error',
        message: 'Failed to load samples',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const status =
      selectedStatus === 'all'
        ? undefined
        : (selectedStatus as BloodSampleStatus);
    fetchSamples(status);
  }, [selectedStatus]);

  const statistics = useMemo(() => {
    const allSamples = samples;
    const total = allSamples.length;
    const byStatus = {
      [BloodSampleStatus.COLLECTED]: allSamples.filter(
        (s) => s.status === BloodSampleStatus.COLLECTED
      ).length,
      [BloodSampleStatus.IN_LAB]: allSamples.filter(
        (s) => s.status === BloodSampleStatus.IN_LAB
      ).length,
      [BloodSampleStatus.TESTED]: allSamples.filter(
        (s) => s.status === BloodSampleStatus.TESTED
      ).length,
      [BloodSampleStatus.COMPLETED]: allSamples.filter(
        (s) => s.status === BloodSampleStatus.COMPLETED
      ).length,
    };
    const todaysSamples = allSamples.filter((s) =>
      isToday(new Date(s.collectedAt))
    ).length;

    return {
      total,
      byStatus,
      todaysSamples,
    };
  }, [samples]);

  const handleView = (sampleId: string) => {
    router.push(`/blood-samples/${sampleId}`);
  };

  const handleSubmitResult = (sampleId: string) => {
    router.push(`/blood-samples/${sampleId}/result`);
  };

  if (error && !isLoading) {
    return (
      <ErrorState
        title="Failed to load samples"
        message={error}
        onRetry={() =>
          fetchSamples(
            selectedStatus === 'all' ? undefined : (selectedStatus as BloodSampleStatus)
          )
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FlaskConical className="h-8 w-8 text-primary" />
            Lab Technician Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your blood samples and track their progress
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/blood-samples/access')}
          >
            <Key className="h-4 w-4 mr-2" />
            Access New Sample
          </Button>
          <Button
            variant="default"
            onClick={() => router.push('/blood-samples')}
          >
            <Eye className="h-4 w-4 mr-2" />
            View All Samples
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Samples
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.byStatus[BloodSampleStatus.COLLECTED]}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Lab
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.byStatus[BloodSampleStatus.IN_LAB]}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.byStatus[BloodSampleStatus.TESTED]}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Samples
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.todaysSamples}</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Tabs */}
      <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value={BloodSampleStatus.COLLECTED}>Collected</TabsTrigger>
          <TabsTrigger value={BloodSampleStatus.IN_LAB}>In Lab</TabsTrigger>
          <TabsTrigger value={BloodSampleStatus.TESTED}>Tested</TabsTrigger>
          <TabsTrigger value={BloodSampleStatus.COMPLETED}>Completed</TabsTrigger>
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
          ) : samples.length === 0 ? (
            <EmptyState
              title="No samples found"
              message={
                selectedStatus === 'all'
                  ? "You don't have any samples yet. Access a sample using the passcode."
                  : `You don't have any ${selectedStatus.toLowerCase()} samples.`
              }
              action={
                selectedStatus === 'all' ? (
                  <Button onClick={() => router.push('/blood-samples/access')}>
                    <Key className="h-4 w-4 mr-2" />
                    Access New Sample
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {samples.map((sample) => (
                <SampleCard
                  key={sample.id}
                  sample={sample}
                  onView={handleView}
                  onSubmitResult={handleSubmitResult}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

