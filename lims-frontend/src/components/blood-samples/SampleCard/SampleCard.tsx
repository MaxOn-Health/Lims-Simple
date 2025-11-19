'use client';

import React from 'react';
import Link from 'next/link';
import { BloodSample } from '@/types/blood-sample.types';
import { Button } from '@/components/common/Button/Button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SampleStatusBadge } from '../SampleStatusBadge/SampleStatusBadge';
import { Eye, FlaskConical, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface SampleCardProps {
  sample: BloodSample;
  onView?: (sampleId: string) => void;
  onSubmitResult?: (sampleId: string) => void;
}

export const SampleCard: React.FC<SampleCardProps> = ({
  sample,
  onView,
  onSubmitResult,
}) => {
  const handleView = () => {
    if (onView) {
      onView(sample.id);
    }
  };

  const handleSubmitResult = () => {
    if (onSubmitResult) {
      onSubmitResult(sample.id);
    }
  };

  const canSubmitResult = sample.status === 'IN_LAB' || sample.status === 'TESTED';

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-border/50 flex flex-col h-full">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <Link
              href={`/blood-samples/${sample.id}`}
              className="text-lg font-semibold text-foreground hover:text-primary transition-colors line-clamp-1 block font-mono"
            >
              {sample.sampleId}
            </Link>
            {sample.patient && (
              <p className="mt-1.5 text-sm text-muted-foreground line-clamp-1">
                {sample.patient.name} ({sample.patient.patientId})
              </p>
            )}
          </div>
          <SampleStatusBadge status={sample.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 p-3 rounded-lg bg-muted/50">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Collected Date
            </p>
            <p className="text-sm font-semibold text-foreground truncate">
              {format(new Date(sample.collectedAt), 'MMM dd, yyyy')}
            </p>
          </div>
          {sample.testedAt && (
            <div className="space-y-1.5 p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Tested Date
              </p>
              <p className="text-sm font-semibold text-foreground truncate">
                {format(new Date(sample.testedAt), 'MMM dd, yyyy')}
              </p>
            </div>
          )}
        </div>

        <Separator className="my-2" />

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
              <FlaskConical className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Collected By</p>
              <p className="text-sm font-semibold text-foreground truncate">
                {sample.collectedByUser?.fullName || 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t flex-shrink-0">
        <div className="flex flex-wrap gap-2 w-full">
          <Link href={`/blood-samples/${sample.id}`} className="flex-1 min-w-[70px]">
            <Button variant="ghost" size="sm" fullWidth className="gap-1.5 text-xs">
              <Eye className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">View</span>
            </Button>
          </Link>
          {canSubmitResult && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSubmitResult}
              className="flex-1 min-w-[70px] gap-1.5 text-xs"
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Submit Result</span>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

