'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Result } from '@/types/result.types';
import { Test, TestFieldType } from '@/types/test.types';
import { Button } from '@/components/common/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ResultStatusBadge } from '../ResultStatusBadge/ResultStatusBadge';
import { VerifiedBadge } from '../VerifiedBadge/VerifiedBadge';
import { NormalRangeIndicator } from '../NormalRangeIndicator/NormalRangeIndicator';
import { VerifyResultModal } from '../VerifyResultModal/VerifyResultModal';
import { HasRole } from '@/components/common/HasRole/HasRole';
import { UserRole } from '@/types/user.types';
import {
  calculateResultStatus,
  formatResultValue,
  getFieldLabel,
  getAbnormalFields,
} from '@/utils/result-helpers';
import { AudiometryResultView } from '../AudiometryResultView/AudiometryResultView';
import { AudiometryReportView } from '../AudiometryReportView/AudiometryReportView';
import { EyeTestReportView } from '../EyeTestReportView/EyeTestReportView';
import {
  FileText,
  User,
  FlaskConical,
  Calendar,
  UserCheck,
  Edit,
  CheckCircle,
  Download,
} from 'lucide-react';

import { reportsService } from '@/services/api/reports.service';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';

interface ResultViewProps {
  result: Result;
  test?: Test;
  onUpdate?: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({ result, test, onUpdate }) => {
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'report'>('table');
  const [isDownloading, setIsDownloading] = useState(false);
  const { addToast } = useUIStore();

  const isAudiometryTest = test && (test.adminRole === 'audiometry' || test.name.toLowerCase().includes('audiometry'));
  const isEyeTest = test && (test.adminRole === 'eye' || test.name.toLowerCase().includes('eye'));

  const handleDownloadReport = async () => {
    if (!result.patient?.id) return;

    setIsDownloading(true);
    try {
      const report = await reportsService.generateReport(result.patient.id);
      await reportsService.downloadReport(report.id);
      addToast({ type: 'success', message: 'Report downloaded successfully' });
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError) || 'Failed to download report',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExportPDF = async () => {
    // ... existing client-side export logic if needed ...
    // But forcing the formal report download is better.
    handleDownloadReport();
  };

  // ... rest of component ...

  if (!test) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">Test information not available</p>
      </div>
    );
  }

  const resultStatus = calculateResultStatus(result.resultValues, test);
  const abnormalFields = getAbnormalFields(result.resultValues, test);

  const handleVerifySuccess = () => {
    setVerifyModalOpen(false);
    if (onUpdate) {
      onUpdate();
    }
  };

  return (
    <div className="space-y-3">
      {/* Result Information Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">Result Information</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadReport}
              className="h-7 text-xs"
              isLoading={isDownloading}
            >
              <Download className="mr-1 h-3 w-3" />
              Export PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Result ID</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{result.id}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Status</p>
              <div className="mt-0.5">
                <ResultStatusBadge status={resultStatus} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Patient Information */}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Patient Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Patient Name</p>
              {result.patient ? (
                <Link
                  href={`/patients/${result.patient.id}`}
                  className="text-sm font-semibold text-primary hover:underline mt-0.5 block"
                >
                  {result.patient.name}
                </Link>
              ) : (
                <p className="text-sm text-foreground mt-0.5">—</p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Patient ID</p>
              <p className="text-sm text-foreground mt-0.5">
                {result.patient?.patientId || '—'}
              </p>
            </div>
          </div>

          <Separator />

          {/* Test Information */}
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Test Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Test Name</p>
              {result.test ? (
                <Link
                  href={`/tests/${result.test.id}`}
                  className="text-sm font-semibold text-primary hover:underline mt-0.5 block"
                >
                  {result.test.name}
                </Link>
              ) : (
                <p className="text-sm text-foreground mt-0.5">{test.name}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Test Category</p>
              <p className="text-sm text-foreground mt-0.5">{test.category}</p>
            </div>
          </div>

          <Separator />

          {/* Entered By Information */}
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Entry Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Entered By</p>
              <p className="text-sm text-foreground mt-0.5">
                {result.enteredByUser?.fullName || result.enteredByUser?.email || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Entered Date</p>
              <p className="text-sm text-foreground mt-0.5">
                {format(new Date(result.enteredAt), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Verification Status</p>
              <div className="mt-0.5">
                <VerifiedBadge isVerified={result.isVerified} />
              </div>
            </div>
            {result.isVerified && result.verifiedByUser && (
              <>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Verified By</p>
                  <p className="text-sm text-foreground mt-0.5">
                    {result.verifiedByUser.fullName || result.verifiedByUser.email}
                  </p>
                </div>
                {result.verifiedAt && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Verified Date</p>
                    <p className="text-sm text-foreground mt-0.5">
                      {format(new Date(result.verifiedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Result Values Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Result Values</CardTitle>
            {(isAudiometryTest || isEyeTest) && (
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'table' ? 'primary' : 'outline'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setViewMode('table')}
                >
                  Table View
                </Button>
                <Button
                  variant={viewMode === 'report' ? 'primary' : 'outline'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setViewMode('report')}
                >
                  Report View
                </Button>
                {viewMode === 'report' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleExportPDF}
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Export PDF
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Check if this is an audiometry test */}
          {isAudiometryTest ? (
            viewMode === 'report' ? (
              <AudiometryReportView
                result={result}
                test={test}
              />
            ) : (
              <AudiometryResultView result={result} test={test} />
            )
          ) : isEyeTest ? (
            viewMode === 'report' ? (
              <EyeTestReportView
                result={result}
                test={test}
              />
            ) : (
              <div className="space-y-4">
                {test.testFields.map((field) => {
                  const value = result.resultValues[field.field_name];
                  const formattedValue = formatResultValue(value, field.field_type);
                  const isAbnormal =
                    field.field_type === TestFieldType.NUMBER &&
                    abnormalFields.some((af) => af.fieldName === field.field_name);

                  return (
                    <div key={field.field_name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">
                          {getFieldLabel(field.field_name)}
                        </p>
                        {isAbnormal && (
                          <span className="text-xs font-medium text-destructive">Abnormal</span>
                        )}
                      </div>
                      <p className="text-base text-foreground">{formattedValue}</p>
                      {field.field_type === TestFieldType.NUMBER &&
                        ((field.normalRangeMin ?? test.normalRangeMin) !== null ||
                          (field.normalRangeMax ?? test.normalRangeMax) !== null) &&
                        value !== undefined &&
                        value !== null &&
                        !isNaN(Number(value)) && (
                          <NormalRangeIndicator
                            value={Number(value)}
                            min={field.normalRangeMin ?? test.normalRangeMin}
                            max={field.normalRangeMax ?? test.normalRangeMax}
                            unit={field.unit ?? test.unit}
                          />
                        )}
                      <Separator />
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="space-y-4">
              {test.testFields.map((field) => {
                const value = result.resultValues[field.field_name];
                const formattedValue = formatResultValue(value, field.field_type);
                const isAbnormal =
                  field.field_type === TestFieldType.NUMBER &&
                  abnormalFields.some((af) => af.fieldName === field.field_name);

                return (
                  <div key={field.field_name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        {getFieldLabel(field.field_name)}
                      </p>
                      {isAbnormal && (
                        <span className="text-xs font-medium text-destructive">Abnormal</span>
                      )}
                    </div>
                    <p className="text-base text-foreground">{formattedValue}</p>
                    {field.field_type === TestFieldType.NUMBER &&
                      ((field.normalRangeMin ?? test.normalRangeMin) !== null ||
                        (field.normalRangeMax ?? test.normalRangeMax) !== null) &&
                      value !== undefined &&
                      value !== null &&
                      !isNaN(Number(value)) && (
                        <NormalRangeIndicator
                          value={Number(value)}
                          min={field.normalRangeMin ?? test.normalRangeMin}
                          max={field.normalRangeMax ?? test.normalRangeMax}
                          unit={field.unit ?? test.unit}
                        />
                      )}
                    <Separator />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes Card */}
      {result.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-foreground whitespace-pre-wrap">{result.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <HasRole allowedRoles={[UserRole.SUPER_ADMIN]}>
          {!result.isVerified && (
            <>
              <Link href={`/results/${result.id}/edit`}>
                <Button variant="outline" className="h-8 text-sm">
                  <Edit className="mr-2 h-3 w-3" />
                  Edit Result
                </Button>
              </Link>
              <Button variant="primary" onClick={() => setVerifyModalOpen(true)} className="h-8 text-sm">
                <CheckCircle className="mr-2 h-3 w-3" />
                Verify Result
              </Button>
            </>
          )}
        </HasRole>
      </div>

      {/* Verify Modal */}
      <VerifyResultModal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        result={result}
        onSuccess={handleVerifySuccess}
      />
    </div>
  );
};

