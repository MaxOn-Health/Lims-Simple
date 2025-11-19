'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { BloodSample } from '@/types/blood-sample.types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/common/Button/Button';
import { SampleStatusBadge } from '../SampleStatusBadge/SampleStatusBadge';
import { Eye, FileText } from 'lucide-react';

interface SampleTableProps {
  samples: BloodSample[];
  onView?: (sample: BloodSample) => void;
  onSubmitResult?: (sample: BloodSample) => void;
  isLoading?: boolean;
}

export const SampleTable: React.FC<SampleTableProps> = ({
  samples,
  onView,
  onSubmitResult,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-10 bg-muted rounded flex-1" />
              <div className="h-10 bg-muted rounded flex-1" />
              <div className="h-10 bg-muted rounded flex-1" />
              <div className="h-10 bg-muted rounded flex-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (samples.length === 0) {
    return null; // Empty state handled by parent
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-semibold">Sample ID</TableHead>
          <TableHead className="font-semibold">Patient Name/ID</TableHead>
          <TableHead className="font-semibold">Status</TableHead>
          <TableHead className="font-semibold">Collected Date</TableHead>
          <TableHead className="font-semibold">Collected By</TableHead>
          <TableHead className="font-semibold">Tested Date</TableHead>
          <TableHead className="font-semibold">Tested By</TableHead>
          <TableHead className="font-semibold text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {samples.map((sample) => {
          const canSubmitResult = sample.status === 'IN_LAB' || sample.status === 'TESTED';

          return (
            <TableRow key={sample.id} className="hover:bg-muted/50">
              <TableCell>
                <Link
                  href={`/blood-samples/${sample.id}`}
                  className="font-mono font-semibold text-primary hover:underline"
                >
                  {sample.sampleId}
                </Link>
              </TableCell>
              <TableCell>
                {sample.patient ? (
                  <Link
                    href={`/patients/${sample.patient.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    <div>
                      <div>{sample.patient.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {sample.patient.patientId}
                      </div>
                    </div>
                  </Link>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <SampleStatusBadge status={sample.status} />
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {format(new Date(sample.collectedAt), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {sample.collectedByUser?.fullName || '—'}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {sample.testedAt ? format(new Date(sample.testedAt), 'MMM dd, yyyy') : '—'}
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {sample.testedByUser?.fullName || '—'}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <Link href={`/blood-samples/${sample.id}`}>
                    <Button variant="ghost" size="sm" className="h-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  {canSubmitResult && (
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8"
                      onClick={() => onSubmitResult?.(sample)}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Submit Result
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

