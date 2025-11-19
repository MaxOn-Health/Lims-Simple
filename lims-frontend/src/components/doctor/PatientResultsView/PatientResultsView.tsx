'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { doctorReviewsService } from '@/services/api/doctor-reviews.service';
import { testsService } from '@/services/api/tests.service';
import { PatientResults } from '@/types/doctor-review.types';
import { Test } from '@/types/test.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TestResultCard } from '../TestResultCard/TestResultCard';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { User, FlaskConical, Calendar, Package, FileText } from 'lucide-react';
import { ReviewForm } from '../ReviewForm/ReviewForm';

export const PatientResultsView: React.FC = () => {
  const params = useParams();
  const patientId = params.patientId as string;
  const { addToast } = useUIStore();

  const [patientResults, setPatientResults] = useState<PatientResults | null>(null);
  const [tests, setTests] = useState<Map<string, Test>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!patientId) {
        setError('Patient ID is required');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await doctorReviewsService.getPatientResults(patientId);
        setPatientResults(data);

        // Fetch test details for each result
        const testIds = new Set<string>();
        data.results.forEach((result) => {
          if (result.test?.id) {
            testIds.add(result.test.id);
          } else if (result.assignment?.testId) {
            testIds.add(result.assignment.testId);
          }
        });

        const testPromises = Array.from(testIds).map((testId) =>
          testsService
            .getTestById(testId)
            .then((test) => ({ testId, test }))
            .catch(() => null)
        );

        const testResults = await Promise.all(testPromises);
        const testMap = new Map<string, Test>();
        testResults.forEach((tr) => {
          if (tr) {
            testMap.set(tr.testId, tr.test);
          }
        });
        setTests(testMap);
      } catch (err) {
        const apiError = err as ApiError;
        setError(getErrorMessage(apiError) || 'Failed to load patient results');
        addToast({
          type: 'error',
          message: 'Failed to load patient results',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [patientId, addToast]);

  // Group results by test category
  const groupedResults = useMemo(() => {
    if (!patientResults) return new Map<string, typeof patientResults.results>();
    
    const grouped = new Map<string, typeof patientResults.results>();
    patientResults.results.forEach((result) => {
      const testId = result.test?.id || result.assignment?.testId || 'unknown';
      const test = tests.get(testId);
      const category = test?.category || 'Other';
      
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(result);
    });
    return grouped;
  }, [patientResults, tests]);

  const handleReviewUpdate = () => {
    // Refetch patient results after review update
    if (patientId) {
      doctorReviewsService.getPatientResults(patientId).then(setPatientResults).catch(() => {
        // Error handling already done in useEffect
      });
    }
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

  if (!patientResults) {
    return (
      <ErrorState
        title="Patient not found"
        message="The patient you're looking for doesn't exist."
        onRetry={() => window.location.reload()}
      />
    );
  }

  const { patient, results, bloodSample, review } = patientResults;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-8 w-8 text-primary" />
          Patient Results Review
        </h1>
        <p className="text-muted-foreground mt-1">
          Review all test results for {patient.name} ({patient.patientId})
        </p>
      </div>

      {/* Patient Information Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Patient Name</p>
              <p className="text-base font-semibold">{patient.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Patient ID</p>
              <p className="text-base font-semibold font-mono">{patient.patientId}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Age</p>
              <p className="text-base font-semibold">{patient.age}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gender</p>
              <p className="text-base font-semibold">{patient.gender}</p>
            </div>
            {patient.contactNumber && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contact</p>
                <p className="text-base font-semibold">{patient.contactNumber}</p>
              </div>
            )}
            {patient.email && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-base font-semibold">{patient.email}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Registration Date</p>
              <p className="text-base font-semibold">
                {format(new Date(patient.createdAt), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blood Sample Information */}
      {bloodSample && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Blood Sample Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sample ID</p>
                <p className="text-base font-semibold font-mono">{bloodSample.sampleId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Collection Date</p>
                <p className="text-base font-semibold">
                  {format(new Date(bloodSample.collectedAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-base font-semibold">{bloodSample.status}</p>
              </div>
              {bloodSample.testedAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tested Date</p>
                  <p className="text-base font-semibold">
                    {format(new Date(bloodSample.testedAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results Grouped by Category */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Test Results</h2>
        {groupedResults.size === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No test results available yet.</p>
            </CardContent>
          </Card>
        ) : (
          Array.from(groupedResults.entries()).map(([category, categoryResults]) => (
            <div key={category} className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Package className="h-5 w-5" />
                {category}
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {categoryResults.map((result) => {
                  const testId = result.test?.id || result.assignment?.testId || 'unknown';
                  const test = tests.get(testId);
                  return (
                    <TestResultCard key={result.id} result={result} test={test || undefined} />
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Section */}
      <ReviewForm
        patientId={patient.id}
        existingReview={review}
        onUpdate={handleReviewUpdate}
      />
    </div>
  );
};

