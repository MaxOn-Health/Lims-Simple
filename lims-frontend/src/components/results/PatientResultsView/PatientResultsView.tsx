'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { resultsService } from '@/services/api/results.service';
import { patientsService } from '@/services/api/patients.service';
import { testsService } from '@/services/api/tests.service';
import { Result } from '@/types/result.types';
import { Patient } from '@/types/patient.types';
import { Test } from '@/types/test.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ResultStatusBadge } from '../ResultStatusBadge/ResultStatusBadge';
import { VerifiedBadge } from '../VerifiedBadge/VerifiedBadge';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import {
  calculateResultStatus,
  formatResultValue,
  getFieldLabel,
  getAbnormalFields,
} from '@/utils/result-helpers';
import { TestFieldType } from '@/types/test.types';
import { User, FileText, Calendar } from 'lucide-react';

export const PatientResultsView: React.FC = () => {
  const params = useParams();
  const patientId = params.id as string;
  const { addToast } = useUIStore();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [results, setResults] = useState<Result[]>([]);
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
        const [patientData, resultsData] = await Promise.all([
          patientsService.getPatientById(patientId),
          resultsService.getResultsByPatient(patientId),
        ]);

        setPatient(patientData);
        setResults(resultsData);

        // Fetch test details for each result
        const testIds = new Set<string>();
        resultsData.forEach((result) => {
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
        setError(getErrorMessage(apiError) || 'Failed to load patient or results data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [patientId]);

  // Group results by test
  const groupedResults = React.useMemo(() => {
    const grouped = new Map<string, Result[]>();
    results.forEach((result) => {
      const testId = result.test?.id || result.assignment?.testId || 'unknown';
      if (!grouped.has(testId)) {
        grouped.set(testId, []);
      }
      grouped.get(testId)!.push(result);
    });
    return grouped;
  }, [results]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = results.length;
    const verified = results.filter((r) => r.isVerified).length;
    const abnormal = results.filter((result) => {
      const testId = result.test?.id || result.assignment?.testId;
      const test = testId ? tests.get(testId) : null;
      if (!test) return false;
      return calculateResultStatus(result.resultValues, test) === 'ABNORMAL';
    }).length;

    return { total, verified, abnormal };
  }, [results, tests]);

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

  if (!patient) {
    return (
      <ErrorState
        title="Patient not found"
        message="The patient you're looking for doesn't exist."
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-8 w-8 text-primary" />
          Patient Test Results
        </h1>
        <p className="text-muted-foreground mt-1">
          All test results for {patient.name} ({patient.patientId})
        </p>
      </div>

      {/* Patient Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Patient Name</p>
              <p className="text-base font-semibold">{patient.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Patient ID</p>
              <p className="text-base font-semibold">{patient.patientId}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Results</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.verified}</div>
            <p className="text-xs text-muted-foreground">Verified Results</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">{stats.abnormal}</div>
            <p className="text-xs text-muted-foreground">Abnormal Results</p>
          </CardContent>
        </Card>
      </div>

      {/* Results by Test */}
      {groupedResults.size === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No results found for this patient</p>
          </CardContent>
        </Card>
      ) : (
        Array.from(groupedResults.entries()).map(([testId, testResults]) => {
          const test = tests.get(testId);
          const testName = test?.name || testResults[0]?.test?.name || 'Unknown Test';

          return (
            <Card key={testId}>
              <CardHeader>
                <CardTitle>{testName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {testResults.map((result) => {
                  const resultTest = tests.get(testId) || test;
                  const status = resultTest
                    ? calculateResultStatus(result.resultValues, resultTest)
                    : 'NORMAL';
                  const abnormalFields = resultTest
                    ? getAbnormalFields(result.resultValues, resultTest)
                    : [];

                  return (
                    <div key={result.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ResultStatusBadge status={status} />
                          <VerifiedBadge isVerified={result.isVerified} />
                        </div>
                        <Link
                          href={`/results/${result.id}`}
                          className="text-sm text-primary hover:underline"
                        >
                          View Details
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {resultTest?.testFields.map((field) => {
                          const value = result.resultValues[field.field_name];
                          const formattedValue = formatResultValue(value, field.field_type);
                          const isAbnormal = abnormalFields.some(
                            (af) => af.fieldName === field.field_name
                          );

                          return (
                            <div key={field.field_name}>
                              <p className="text-sm font-medium text-muted-foreground">
                                {getFieldLabel(field.field_name)}
                                {isAbnormal && (
                                  <span className="text-destructive ml-2">(Abnormal)</span>
                                )}
                              </p>
                              <p className="text-base text-foreground">{formattedValue}</p>
                            </div>
                          );
                        })}
                      </div>

                      {result.notes && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Notes</p>
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {result.notes}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Entered: {format(new Date(result.enteredAt), 'MMM dd, yyyy')}
                        </div>
                        {result.isVerified && result.verifiedAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Verified: {format(new Date(result.verifiedAt), 'MMM dd, yyyy')}
                          </div>
                        )}
                      </div>

                      {result.id !== testResults[testResults.length - 1].id && <Separator />}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};

