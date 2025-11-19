'use client';

import React, { useEffect, useState } from 'react';
import { ReportStatus } from '@/types/report.types';
import { ReportStatusBadge } from '../ReportStatusBadge/ReportStatusBadge';
import { reportsService } from '@/services/api/reports.service';
import { Report } from '@/types/report.types';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { Loader2, AlertCircle } from 'lucide-react';

interface ReportStatusTrackerProps {
  reportId: string;
  initialStatus: ReportStatus;
  onStatusChange?: (status: ReportStatus, report: Report) => void;
  onComplete?: (report: Report) => void;
  pollInterval?: number;
}

export const ReportStatusTracker: React.FC<ReportStatusTrackerProps> = ({
  reportId,
  initialStatus,
  onStatusChange,
  onComplete,
  pollInterval = 3000, // 3 seconds
}) => {
  const { addToast } = useUIStore();
  const [status, setStatus] = useState<ReportStatus>(initialStatus);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const fetchReport = async () => {
    try {
      const updatedReport = await reportsService.getReportById(reportId);
      setReport(updatedReport);
      
      if (updatedReport.status !== status) {
        setStatus(updatedReport.status);
        if (onStatusChange) {
          onStatusChange(updatedReport.status, updatedReport);
        }

        if (updatedReport.status === ReportStatus.COMPLETED && onComplete) {
          onComplete(updatedReport);
        }
      }
      setError(null);
    } catch (err) {
      const apiError = err as ApiError;
      setError(getErrorMessage(apiError));
      addToast({
        type: 'error',
        message: 'Failed to fetch report status',
      });
    }
  };

  useEffect(() => {
    // Start polling if status is GENERATING
    if (status === ReportStatus.GENERATING) {
      setIsPolling(true);
      const interval = setInterval(() => {
        fetchReport();
      }, pollInterval);

      return () => {
        clearInterval(interval);
        setIsPolling(false);
      };
    } else {
      setIsPolling(false);
    }
  }, [status, reportId, pollInterval]);

  // Fetch initial report data
  useEffect(() => {
    fetchReport();
  }, [reportId]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Status:</span>
        <ReportStatusBadge status={status} />
        {isPolling && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Checking...
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
        </div>
      )}

      {status === ReportStatus.FAILED && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-800 dark:text-red-200">
            Report generation failed. Please try generating again.
          </p>
        </div>
      )}
    </div>
  );
};



