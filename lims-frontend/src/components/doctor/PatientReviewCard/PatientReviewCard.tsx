'use client';

import React from 'react';
import Link from 'next/link';
import { PatientReview, ReviewStatus } from '@/types/doctor-review.types';
import { Button } from '@/components/common/Button/Button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ReviewStatusBadge } from '../ReviewStatusBadge/ReviewStatusBadge';
import { Eye, FileText, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface PatientReviewCardProps {
  patientReview: PatientReview;
  onReview?: (patientId: string) => void;
}

export const PatientReviewCard: React.FC<PatientReviewCardProps> = ({
  patientReview,
  onReview,
}) => {
  const { patient, status, totalTests, submittedTests, reviewedAt, signedAt } = patientReview;

  const handleReview = () => {
    if (onReview) {
      onReview(patient.id);
    }
  };

  const isAllTestsSubmitted = totalTests === submittedTests;
  const canReview = status === ReviewStatus.PENDING && isAllTestsSubmitted;
  const canSign = status === ReviewStatus.REVIEWED;

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-border/50 flex flex-col h-full">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <Link
              href={`/doctor/patients/${patient.id}/review`}
              className="text-lg font-semibold text-foreground hover:text-primary transition-colors line-clamp-1 block"
            >
              {patient.name}
            </Link>
            <p className="mt-1.5 text-sm text-muted-foreground line-clamp-1 font-mono">
              {patient.patientId}
            </p>
          </div>
          <ReviewStatusBadge status={status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 p-3 rounded-lg bg-muted/50">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Tests Completed
            </p>
            <p className="text-sm font-semibold text-foreground">
              {submittedTests} / {totalTests}
            </p>
          </div>
          {reviewedAt && (
            <div className="space-y-1.5 p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Reviewed Date
              </p>
              <p className="text-sm font-semibold text-foreground truncate">
                {format(new Date(reviewedAt), 'MMM dd, yyyy')}
              </p>
            </div>
          )}
          {signedAt && (
            <div className="space-y-1.5 p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Signed Date
              </p>
              <p className="text-sm font-semibold text-foreground truncate">
                {format(new Date(signedAt), 'MMM dd, yyyy')}
              </p>
            </div>
          )}
        </div>

        <Separator className="my-2" />

        <div className="flex items-center gap-2">
          <div className={`flex-1 h-2 rounded-full overflow-hidden bg-muted`}>
            <div
              className={`h-full transition-all ${
                isAllTestsSubmitted ? 'bg-green-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${(submittedTests / totalTests) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            {Math.round((submittedTests / totalTests) * 100)}%
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t flex-shrink-0">
        <div className="flex flex-wrap gap-2 w-full">
          <Link
            href={`/doctor/patients/${patient.id}/review`}
            className="flex-1 min-w-[70px]"
          >
            <Button variant="ghost" size="sm" fullWidth className="gap-1.5 text-xs">
              <Eye className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">View</span>
            </Button>
          </Link>
          {canReview && (
            <Button
              variant="default"
              size="sm"
              onClick={handleReview}
              className="flex-1 min-w-[70px] gap-1.5 text-xs"
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Review</span>
            </Button>
          )}
          {canSign && (
            <Button
              variant="default"
              size="sm"
              onClick={handleReview}
              className="flex-1 min-w-[70px] gap-1.5 text-xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Sign</span>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

