'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { ReportReadiness } from '@/types/report.types';
import { cn } from '@/lib/utils';

interface ReportReadinessCheckProps {
  readiness: ReportReadiness;
  className?: string;
}

export const ReportReadinessCheck: React.FC<ReportReadinessCheckProps> = ({
  readiness,
  className,
}) => {
  const { isReady, details } = readiness;

  const requirements = [
    {
      label: 'All tests submitted',
      met: details.allAssignmentsSubmitted,
    },
    {
      label: 'All results exist',
      met: details.allResultsExist,
    },
    {
      label: 'Blood test completed',
      met: details.bloodTestCompleted,
    },
    {
      label: 'Doctor review exists',
      met: details.reviewExists,
    },
    {
      label: 'Doctor has signed',
      met: details.isSigned,
    },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Report Readiness Checklist
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {requirements.map((req, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-3 p-3 rounded-md',
                req.met ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
              )}
            >
              {req.met ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  req.met
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                )}
              >
                {req.label}
              </span>
            </div>
          ))}
        </div>
        {isReady && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              ✓ All requirements met. Report can be generated.
            </p>
          </div>
        )}
        {!isReady && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              ⚠ Some requirements are not met. Please complete all requirements before generating a report.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};



