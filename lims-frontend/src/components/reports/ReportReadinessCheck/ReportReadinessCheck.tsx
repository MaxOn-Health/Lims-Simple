'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';
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
      optional: false,
      description: 'All assigned tests must be marked as submitted',
    },
    {
      label: 'All results exist',
      met: details.allResultsExist,
      optional: false,
      description: 'Test results must be entered for all tests',
    },
    {
      label: 'Blood test completed',
      met: details.bloodTestCompleted,
      optional: true,
      description: 'Only required if patient has blood tests',
    },
    {
      label: 'Doctor review exists',
      met: details.reviewExists,
      optional: true,
      description: 'Optional - can generate unsigned report',
    },
    {
      label: 'Doctor has signed',
      met: details.isSigned,
      optional: true,
      description: 'Optional - can generate unsigned report',
    },
  ];

  const failedRequired = requirements.filter(r => !r.optional && !r.met);
  const failedOptional = requirements.filter(r => r.optional && !r.met);
  const canGenerate = failedRequired.length === 0;

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
          {requirements.map((req, index) => {
            const isFailed = !req.met;
            
            return (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-md',
                  req.met 
                    ? 'bg-green-50 dark:bg-green-900/20' 
                    : req.optional
                      ? 'bg-yellow-50 dark:bg-yellow-900/20'
                      : 'bg-red-50 dark:bg-red-900/20'
                )}
              >
                {req.met ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                ) : req.optional ? (
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <span
                    className={cn(
                      'block text-sm font-medium',
                      req.met
                        ? 'text-green-800 dark:text-green-200'
                        : req.optional
                          ? 'text-yellow-800 dark:text-yellow-200'
                          : 'text-red-800 dark:text-red-200'
                    )}
                  >
                    {req.label}
                    {req.optional && isFailed && (
                      <span className="ml-2 text-xs font-normal text-yellow-600 dark:text-yellow-400">
                        (Optional)
                      </span>
                    )}
                  </span>
                  {req.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {req.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {canGenerate && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              ✓ All required checks passed. Report can be generated.
            </p>
            {failedOptional.length > 0 && (
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Some optional checks are pending. You can generate the report without them.
              </p>
            )}
          </div>
        )}

        {!canGenerate && failedRequired.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              ⚠️ Required checks are not complete. Please complete all required items before generating a report.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};



