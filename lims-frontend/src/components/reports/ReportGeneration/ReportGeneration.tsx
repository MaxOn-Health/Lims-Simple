'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { reportsService } from '@/services/api/reports.service';
import { patientsService } from '@/services/api/patients.service';
import { Report, ReportReadiness } from '@/types/report.types';
import { Patient } from '@/types/patient.types';
import { ReportReadinessCheck } from '../ReportReadinessCheck/ReportReadinessCheck';
import { ReportStatusTracker } from '../ReportStatusTracker/ReportStatusTracker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/common/Button/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { FileText, Loader2, Search } from 'lucide-react';
import { Skeleton } from '@/components/common/Skeleton';
import { useDebounce } from '@/hooks/useDebounce/useDebounce';

export const ReportGeneration: React.FC = () => {
  const router = useRouter();
  const { addToast } = useUIStore();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [readiness, setReadiness] = useState<ReportReadiness | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<Report | null>(null);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isLoadingReadiness, setIsLoadingReadiness] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchPatients = async () => {
    setIsLoadingPatients(true);
    try {
      const response = await patientsService.getPatients({ limit: 100 });
      setPatients(response.data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(getErrorMessage(apiError));
    } finally {
      setIsLoadingPatients(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      patient.patientId.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const handlePatientSelect = async (patientId: string) => {
    setSelectedPatientId(patientId);
    const patient = patients.find((p) => p.id === patientId);
    setSelectedPatient(patient || null);
    setGeneratedReport(null);

    if (patientId) {
      setIsLoadingReadiness(true);
      try {
        const readinessData = await reportsService.checkReportReadiness(patientId);
        setReadiness(readinessData);
      } catch (err) {
        const apiError = err as ApiError;
        addToast({
          type: 'error',
          message: getErrorMessage(apiError) || 'Failed to check readiness',
        });
      } finally {
        setIsLoadingReadiness(false);
      }
    } else {
      setReadiness(null);
    }
  };

  const handleGenerate = async () => {
    if (!selectedPatientId || !readiness?.isReady) {
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const report = await reportsService.generateReport(selectedPatientId);
      setGeneratedReport(report);
      addToast({
        type: 'success',
        message: 'Report generation started successfully',
      });

      // If status is GENERATING, the status tracker will handle polling
      if (report.status === 'GENERATING') {
        // Status tracker will handle the rest
      } else if (report.status === 'COMPLETED') {
        // Redirect to report view
        setTimeout(() => {
          router.push(`/reports/${report.id}`);
        }, 1500);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(getErrorMessage(apiError));
      addToast({
        type: 'error',
        message: getErrorMessage(apiError) || 'Failed to generate report',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patient-search">Search Patient</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="patient-search"
                placeholder="Search by patient name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="patient-select">Select Patient</Label>
            {isLoadingPatients ? (
              <Skeleton height="h-10" />
            ) : (
              <Select value={selectedPatientId} onValueChange={handlePatientSelect}>
                <SelectTrigger id="patient-select">
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {filteredPatients.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                      No patients found
                    </div>
                  ) : (
                    filteredPatients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name} ({patient.patientId})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedPatient && (
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm font-medium">Selected Patient:</p>
              <p className="text-base font-semibold">{selectedPatient.name}</p>
              <p className="text-sm text-muted-foreground">{selectedPatient.patientId}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPatientId && (
        <>
          {isLoadingReadiness ? (
            <Card>
              <CardContent className="py-8">
                <Skeleton height="h-40" />
              </CardContent>
            </Card>
          ) : readiness ? (
            <>
              <ReportReadinessCheck readiness={readiness} />
              <Card>
                <CardContent className="pt-6">
                  <Button
                    onClick={handleGenerate}
                    disabled={!readiness.isReady || isGenerating}
                    className="w-full gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : null}

          {generatedReport && (
            <Card>
              <CardHeader>
                <CardTitle>Report Generation Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ReportStatusTracker
                  reportId={generatedReport.id}
                  initialStatus={generatedReport.status}
                  onComplete={(report) => {
                    addToast({
                      type: 'success',
                      message: 'Report generated successfully',
                    });
                    setTimeout(() => {
                      router.push(`/reports/${report.id}`);
                    }, 1500);
                  }}
                />
              </CardContent>
            </Card>
          )}

          {error && (
            <ErrorState
              title="Error"
              message={error}
              onRetry={() => setError(null)}
            />
          )}
        </>
      )}
    </div>
  );
};

