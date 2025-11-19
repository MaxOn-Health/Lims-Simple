'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Result, ResultStatus } from '@/types/result.types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/common/Button/Button';
import { ResultStatusBadge } from '../ResultStatusBadge/ResultStatusBadge';
import { VerifiedBadge } from '../VerifiedBadge/VerifiedBadge';
import { HasRole } from '@/components/common/HasRole/HasRole';
import { UserRole } from '@/types/user.types';
import { Eye, Edit, CheckCircle } from 'lucide-react';
import { formatResultValue, calculateResultStatus } from '@/utils/result-helpers';
import { TestFieldType } from '@/types/test.types';
import { Test } from '@/types/test.types';

interface ResultTableProps {
  results: Result[];
  tests?: Map<string, Test>;
  onEdit?: (result: Result) => void;
  onVerify?: (result: Result) => void;
  isLoading?: boolean;
}

export const ResultTable: React.FC<ResultTableProps> = ({
  results,
  tests,
  onEdit,
  onVerify,
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

  if (results.length === 0) {
    return null; // Empty state handled by parent
  }

  // Helper to get result summary (first few key values)
  const getResultSummary = (result: Result): string => {
    const values = Object.entries(result.resultValues).slice(0, 2);
    return values
      .map(([key, value]) => {
        // Try to determine field type from test if available
        const formatted = formatResultValue(value, TestFieldType.TEXT);
        return `${key}: ${formatted}`;
      })
      .join(', ');
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-semibold">Patient Name/ID</TableHead>
          <TableHead className="font-semibold">Test Name</TableHead>
          <TableHead className="font-semibold">Result Summary</TableHead>
          <TableHead className="font-semibold">Status</TableHead>
          <TableHead className="font-semibold">Entered By</TableHead>
          <TableHead className="font-semibold">Entered Date</TableHead>
          <TableHead className="font-semibold">Verified</TableHead>
          <TableHead className="font-semibold text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((result) => {
          // Calculate status from test data if available
          let status: ResultStatus = 'NORMAL';
          if (result.test) {
            // Try to get full test data from tests map or use result.test
            const testData = tests?.get(result.test.id) || result.test;
            if (testData && 'testFields' in testData) {
              status = calculateResultStatus(result.resultValues, testData as Test);
            }
          }

          return (
            <TableRow key={result.id} className="hover:bg-muted/50">
              <TableCell>
                {result.patient ? (
                  <Link
                    href={`/patients/${result.patient.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    <div>
                      <div>{result.patient.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {result.patient.patientId}
                      </div>
                    </div>
                  </Link>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {result.test ? (
                  <Link
                    href={`/tests/${result.test.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {result.test.name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground line-clamp-1">
                  {getResultSummary(result)}
                </span>
              </TableCell>
              <TableCell>
                <ResultStatusBadge status={status} />
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {result.enteredByUser?.fullName || result.enteredByUser?.email || '—'}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {format(new Date(result.enteredAt), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>
                <VerifiedBadge isVerified={result.isVerified} />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <Link href={`/results/${result.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Button>
                  </Link>
                  <HasRole allowedRoles={[UserRole.SUPER_ADMIN]}>
                    {onEdit && !result.isVerified && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onEdit(result)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    )}
                    {onVerify && !result.isVerified && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onVerify(result)}
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span className="sr-only">Verify</span>
                      </Button>
                    )}
                  </HasRole>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

