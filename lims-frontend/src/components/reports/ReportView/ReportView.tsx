'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Report } from '@/types/report.types';
import { reportsService } from '@/services/api/reports.service';
import { PDFViewer } from '../PDFViewer/PDFViewer';
import { ReportStatusBadge } from '../ReportStatusBadge/ReportStatusBadge';
import { ReportStatusTracker } from '../ReportStatusTracker/ReportStatusTracker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/common/Button/Button';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { FileText, User, Stethoscope, Download, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/common/Skeleton';
import { downloadReport, openReportInNewTab } from '@/utils/report-download';
import { ReportStatus } from '@/types/report.types';

interface ReportViewProps {
  reportId: string;
}

export const ReportView: React.FC<ReportViewProps> = ({ reportId }) => {
  const { addToast } = useUIStore();
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const reportData = await reportsService.getReportById(reportId);
      setReport(reportData);

      // Construct PDF URL from pdfUrl field or download endpoint
      if (reportData.pdfUrl) {
        // If pdfUrl is a relative path, construct full URL
        if (reportData.pdfUrl.startsWith('http')) {
          setPdfUrl(reportData.pdfUrl);
        } else {
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
          setPdfUrl(`${apiBaseUrl}/reports/${reportId}/download`);
        }
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(getErrorMessage(apiError));
      addToast({
        type: 'error',
        message: 'Failed to load report',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const handleDownload = async () => {
    if (!report) return;

    try {
      await downloadReport(report.id);
      addToast({
        type: 'success',
        message: 'Report downloaded successfully',
      });
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError) || 'Failed to download report',
      });
    }
  };

  const handleOpenInNewTab = async () => {
    if (!report) return;

    try {
      await openReportInNewTab(report.id);
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError) || 'Failed to open report',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton height="h-10" />
        <Skeleton height="h-64" />
        <Skeleton height="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load report"
        message={error}
        onRetry={fetchReport}
      />
    );
  }

  if (!report) {
    return (
      <EmptyState
        title="Report Not Found"
        message="The report you are looking for does not exist."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Report Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Information
            </CardTitle>
            <ReportStatusBadge status={report.status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Report Number</p>
              <p className="text-base font-semibold font-mono">{report.reportNumber}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <ReportStatusBadge status={report.status} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Generated Date</p>
              <p className="text-base font-semibold">
                {report.generatedAt
                  ? format(new Date(report.generatedAt), 'MMM dd, yyyy HH:mm')
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Generated By</p>
              <p className="text-base font-semibold">
                {report.generatedByUser?.fullName || 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Information */}
      {report.patient && (
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
                <p className="text-base font-semibold">{report.patient.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Patient ID</p>
                <p className="text-base font-semibold font-mono">{report.patient.patientId}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link href={`/patients/${report.patientId}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View Patient Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Doctor Information */}
      {report.doctorReview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Doctor Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.doctorReview.signedAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Signed Date</p>
                  <p className="text-base font-semibold">
                    {format(new Date(report.doctorReview.signedAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              )}
              {report.doctorReview.remarks && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Remarks</p>
                  <p className="text-base whitespace-pre-wrap">{report.doctorReview.remarks}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Tracker for GENERATING status */}
      {report.status === ReportStatus.GENERATING && (
        <Card>
          <CardHeader>
            <CardTitle>Generation Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ReportStatusTracker
              reportId={report.id}
              initialStatus={report.status}
              onComplete={(updatedReport) => {
                setReport(updatedReport);
                addToast({
                  type: 'success',
                  message: 'Report generated successfully',
                });
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* PDF Preview */}
      {report.status === ReportStatus.COMPLETED && pdfUrl && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Report PDF</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={handleOpenInNewTab} className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PDFViewer url={pdfUrl} onDownload={handleDownload} />
          </CardContent>
        </Card>
      )}

      {report.status === ReportStatus.COMPLETED && !pdfUrl && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">PDF not available for this report.</p>
          </CardContent>
        </Card>
      )}

      {report.status === ReportStatus.FAILED && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive">Report generation failed. Please try generating again.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};



