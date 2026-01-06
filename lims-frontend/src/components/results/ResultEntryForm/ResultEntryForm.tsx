'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { assignmentsService } from '@/services/api/assignments.service';
import { testsService } from '@/services/api/tests.service';
import { resultsService } from '@/services/api/results.service';
import { Assignment, AssignmentStatus } from '@/types/assignment.types';
import { Test } from '@/types/test.types';
import { SubmitResultRequest, UpdateResultRequest } from '@/types/result.types';
import { DynamicResultForm } from '../DynamicResultForm/DynamicResultForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { FileText, User, FlaskConical, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { reportsService } from '@/services/api/reports.service';
import { ResultSuccessModal } from '../ResultSuccessModal/ResultSuccessModal';
import { ResultPreviewModal } from '../ResultPreviewModal/ResultPreviewModal';
import { PinConfirmationModal } from '@/components/common/PinConfirmationModal/PinConfirmationModal';

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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedReportId, setGeneratedReportId] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingSubmissionData, setPendingSubmissionData] = useState<SubmitResultRequest | UpdateResultRequest | null>(null);

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

  const handleSubmit = async (data: SubmitResultRequest | UpdateResultRequest) => {
    // Store data and open PIN modal instead of submitting directly
    setPendingSubmissionData(data);
    setShowPinModal(true);
  };

  const handlePinSuccess = async () => {
    setShowPinModal(false);
    const data = pendingSubmissionData;

    if (!assignment || !data) {
      addToast({
        type: 'error',
        message: 'Submission data is missing',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await resultsService.submitResult({
        ...data,
        assignmentId,
      } as SubmitResultRequest);

      addToast({
        type: 'success',
        message: 'Result submitted successfully',
      });

      // Show success modal instead of auto-redirecting
      setShowSuccessModal(true);

      // Attempt to generate report immediately if possible (optimistic)
      if (assignment.patientId) {
        try {
          const report = await reportsService.generateReport(assignment.patientId);
          setGeneratedReportId(report.id);
        } catch (reportErr) {
          console.error('Failed to auto-generate report:', reportErr);
          // We don't block the success modal if report generation fails, 
          // user can try again from dashboard or we'll handle in print handler
        }
      }

    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError) || 'Failed to submit result',
      });
      setIsSubmitting(false); // Only reset if error, keep loading if success (modal shows)
    } finally {
      if (!showSuccessModal) {
        setIsSubmitting(false);
      }
    }
  };

  const handlePreview = (data: SubmitResultRequest | UpdateResultRequest) => {
    setPreviewData(data);
    setShowPreviewModal(true);
  };

  const handlePrintReport = async () => {
    if (!assignment?.patientId) return;

    try {
      let reportId = generatedReportId;

      // If we didn't successfully generate it yet, try now
      if (!reportId) {
        setIsSubmitting(true); // Re-use submitting state for loading
        const report = await reportsService.generateReport(assignment.patientId);
        reportId = report.id;
        setGeneratedReportId(report.id);
      }

      if (reportId) {
        // Download/Open PDF
        await reportsService.downloadReport(reportId);
      }
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError) || 'Failed to generate report for printing',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
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
    <div className="space-y-6 max-w-[1600px] mx-auto pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-gray-900">
          <FileText className="h-8 w-8 text-primary" />
          Enter Test Results
        </h1>
        <p className="text-muted-foreground text-lg">
          Record findings for the assigned test.
        </p>
      </div>

      {/* Status Warning */}
      {assignment.status !== AssignmentStatus.IN_PROGRESS &&
        assignment.status !== AssignmentStatus.ASSIGNED && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Cannot submit results. Assignment must be IN_PROGRESS or ASSIGNED. Current status:{' '}
              {assignment.status}
            </AlertDescription>
          </Alert>
        )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Context (Sticky) */}
        <div className="lg:col-span-1 sticky top-6 space-y-6">
          {/* Patient Card */}
          {assignment.patient && (
            <Card className="border-none shadow-md bg-blue-50/50 border-blue-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-600 uppercase tracking-wider flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Patient Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-xl font-bold text-blue-900">
                    {assignment.patient.name}
                  </p>
                  <p className="text-sm text-blue-700 font-mono">
                    ID: {assignment.patient.patientId}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Card */}
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FlaskConical className="h-4 w-4" />
                Test Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-gray-900">
                  {test.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {test.description || 'No description available.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Data Entry Form */}
        <div className="lg:col-span-2">
          {(assignment.status === AssignmentStatus.IN_PROGRESS || assignment.status === AssignmentStatus.ASSIGNED) && (
            <Card className="border-none shadow-lg ring-1 ring-black/5">
              <CardHeader className="bg-gray-50 border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  Result Values
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Please enter the observed values carefully.
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <DynamicResultForm
                  test={test}
                  onSubmit={handleSubmit}
                  onPreview={handlePreview}
                  onCancel={handleCancel}
                  mode="create"
                  isSubmitting={isSubmitting}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ResultSuccessModal
        isOpen={showSuccessModal}
        onClose={handleBackToDashboard}
        onPrintReport={handlePrintReport}
        onBackToDashboard={handleBackToDashboard}
      />

      {assignment && test && (
        <ResultPreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          data={previewData || {}}
          test={test}
          assignment={assignment}
        />
      )}

      <PinConfirmationModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handlePinSuccess}
        title="Confirm Submission"
        description="Please enter your 4-digit PIN to confirm these results."
      />
    </div>
  );
};

// Add imports:
// import { PinConfirmationModal } from '@/components/common/PinConfirmationModal/PinConfirmationModal';
