'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
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
import { FileText, User, FlaskConical, AlertCircle, Edit3, History } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { reportsService } from '@/services/api/reports.service';
import { ResultSuccessModal } from '../ResultSuccessModal/ResultSuccessModal';
import { ResultPreviewModal } from '../ResultPreviewModal/ResultPreviewModal';
import { PinConfirmationModal } from '@/components/common/PinConfirmationModal/PinConfirmationModal';
import { useAuthStore } from '@/store/auth.store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const ResultEntryForm: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const assignmentId = params.assignmentId as string;
  const isEditMode = searchParams.get('mode') === 'edit';
  const { addToast } = useUIStore();
  const { user } = useAuthStore();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [existingResult, setExistingResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedReportId, setGeneratedReportId] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingSubmissionData, setPendingSubmissionData] = useState<SubmitResultRequest | UpdateResultRequest | null>(null);
  const [editReason, setEditReason] = useState('');

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
        const assignmentData = await assignmentsService.getAssignmentById(assignmentId);
        setAssignment(assignmentData);

        // Fetch test details
        if (assignmentData.testId) {
          const testDetails = await testsService.getTestById(assignmentData.testId);
          setTest(testDetails);
        }

        // Check if we can view/edit based on status and ownership
        const canEdit = isEditMode && 
          assignmentData.status === AssignmentStatus.SUBMITTED && 
          assignmentData.adminId === user?.id;
        const canSubmit = assignmentData.status === AssignmentStatus.IN_PROGRESS || 
                          assignmentData.status === AssignmentStatus.ASSIGNED;

        // If edit mode, fetch existing result
        if (isEditMode && canEdit) {
          try {
            const result = await resultsService.findByAssignment(assignmentId);
            setExistingResult(result);
          } catch (resultErr) {
            console.error('Failed to fetch existing result:', resultErr);
          }
        }

        // Set error if neither submit nor edit is allowed
        if (!canSubmit && !canEdit) {
          let errorMessage = `Cannot ${isEditMode ? 'edit' : 'submit'} results. `;
          if (assignmentData.status === AssignmentStatus.SUBMITTED && assignmentData.adminId !== user?.id) {
            errorMessage += 'You can only edit your own submitted results.';
          } else if (assignmentData.status === AssignmentStatus.SUBMITTED) {
            errorMessage += 'Assignment is submitted. Use edit mode to make changes.';
          } else {
            errorMessage += `Assignment must be IN_PROGRESS or ASSIGNED. Current status: ${assignmentData.status}`;
          }
          setError(errorMessage);
        }
      } catch (err) {
        const apiError = err as ApiError;
        setError(getErrorMessage(apiError) || 'Failed to load assignment or test data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [assignmentId, isEditMode, user?.id]);

  const handleSubmit = async (data: SubmitResultRequest | UpdateResultRequest) => {
    // For edit mode, require edit reason
    if (isEditMode) {
      if (!editReason.trim()) {
        addToast({
          type: 'error',
          message: 'Please provide a reason for editing this result',
        });
        return;
      }
    }

    // Store data and open PIN modal instead of submitting directly
    setPendingSubmissionData({ ...data, editReason } as any);
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
      if (isEditMode && existingResult) {
        // Edit existing result
        await resultsService.editResult(existingResult.id, data as UpdateResultRequest);

        addToast({
          type: 'success',
          message: 'Result updated successfully',
        });

        setShowSuccessModal(true);
      } else {
        // Submit new result
        await resultsService.submitResult({
          ...data,
          assignmentId,
        } as SubmitResultRequest);

        addToast({
          type: 'success',
          message: 'Result submitted successfully',
        });

        setShowSuccessModal(true);

        // Attempt to generate report immediately if possible (optimistic)
        if (assignment.patientId) {
          try {
            const report = await reportsService.generateReport(assignment.patientId);
            setGeneratedReportId(report.id);
          } catch (reportErr) {
            console.error('Failed to auto-generate report:', reportErr);
          }
        }
      }
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError) || `Failed to ${isEditMode ? 'update' : 'submit'} result`,
      });
      setIsSubmitting(false);
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

      if (!reportId) {
        setIsSubmitting(true);
        const report = await reportsService.generateReport(assignment.patientId);
        reportId = report.id;
        setGeneratedReportId(report.id);
      }

      if (reportId) {
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

  // Determine if form should be displayed
  const canSubmit = assignment?.status === AssignmentStatus.IN_PROGRESS || 
                    assignment?.status === AssignmentStatus.ASSIGNED;
  const canEdit = isEditMode && 
                  assignment?.status === AssignmentStatus.SUBMITTED && 
                  assignment?.adminId === user?.id;
  const showForm = canSubmit || canEdit;

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
        title="Cannot Access"
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
          {canEdit ? (
            <>
              <Edit3 className="h-8 w-8 text-yellow-600" />
              Edit Test Result
            </>
          ) : (
            <>
              <FileText className="h-8 w-8 text-primary" />
              Enter Test Results
            </>
          )}
        </h1>
        <p className="text-muted-foreground text-lg">
          {canEdit 
            ? 'Update the existing result with corrections.'
            : 'Record findings for the assigned test.'}
        </p>
      </div>

      {/* Edit Mode Banner */}
      {canEdit && existingResult && (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
          <History className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            You are editing a submitted result. The original values were entered on{' '}
            {existingResult.enteredAt && new Date(existingResult.enteredAt).toLocaleString()}.
            {existingResult.isEdited && (
              <span className="block mt-1 text-sm">
                This result was previously edited on {new Date(existingResult.editedAt).toLocaleString()}.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Status Warning */}
      {assignment.status !== AssignmentStatus.IN_PROGRESS &&
        assignment.status !== AssignmentStatus.ASSIGNED &&
        assignment.status !== AssignmentStatus.SUBMITTED && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Cannot {isEditMode ? 'edit' : 'submit'} results. Assignment must be IN_PROGRESS or ASSIGNED. Current status:{' '}
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
          {showForm && (
            <Card className="border-none shadow-lg ring-1 ring-black/5">
              <CardHeader className="bg-gray-50 border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  Result Values
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {canEdit 
                    ? 'Update the observed values as needed.'
                    : 'Please enter the observed values carefully.'}
                </p>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Edit Reason Field (only in edit mode) */}
                {canEdit && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <Label htmlFor="editReason" className="text-yellow-800 font-medium">
                      Reason for Edit <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="editReason"
                      placeholder="Explain why you are editing this result..."
                      value={editReason}
                      onChange={(e) => setEditReason(e.target.value)}
                      className="mt-1 border-yellow-300 focus:border-yellow-500"
                    />
                    <p className="text-xs text-yellow-600 mt-1">
                      This reason will be recorded in the audit trail.
                    </p>
                  </div>
                )}

                <DynamicResultForm
                  test={test}
                  initialValues={existingResult?.resultValues || {}}
                  onSubmit={handleSubmit}
                  onPreview={handlePreview}
                  onCancel={handleCancel}
                  mode={canEdit ? 'edit' : 'create'}
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
        isEditMode={canEdit}
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
        title={canEdit ? 'Confirm Update' : 'Confirm Submission'}
        description={canEdit 
          ? 'Please enter your 4-digit PIN to confirm these changes.'
          : 'Please enter your 4-digit PIN to confirm these results.'
        }
      />
    </div>
  );
};

