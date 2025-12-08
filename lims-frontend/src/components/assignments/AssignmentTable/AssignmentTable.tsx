'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Assignment } from '@/types/assignment.types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/common/Button/Button';
import { AssignmentStatusBadge } from '../AssignmentStatusBadge/AssignmentStatusBadge';
import { HasRole } from '@/components/common/HasRole/HasRole';
import { UserRole } from '@/types/user.types';
import { Eye, UserCog, RefreshCw, FlaskConical } from 'lucide-react';
import { formatAssignmentDateShort } from '@/utils/assignment-helpers';

interface AssignmentTableProps {
  assignments: Assignment[];
  onReassign?: (assignmentId: string) => void;
  onUpdateStatus?: (assignmentId: string) => void;
  isLoading?: boolean;
}

export const AssignmentTable: React.FC<AssignmentTableProps> = ({
  assignments,
  onReassign,
  onUpdateStatus,
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
              <div className="h-10 bg-muted rounded flex-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return null; // Empty state handled by parent
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-semibold">Patient Name/ID</TableHead>
          <TableHead className="font-semibold">Test Name</TableHead>
          <TableHead className="font-semibold">Assigned Admin</TableHead>
          <TableHead className="font-semibold">Status</TableHead>
          <TableHead className="font-semibold">Assigned Date</TableHead>
          <TableHead className="font-semibold">Completed Date</TableHead>
          <TableHead className="font-semibold text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assignments.map((assignment) => (
          <TableRow key={assignment.id} className="hover:bg-muted/50">
            <TableCell>
              {assignment.patient ? (
                <Link
                  href={`/patients/${assignment.patientId}`}
                  className="font-medium text-primary hover:underline"
                >
                  <div>
                    <div>{assignment.patient.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {assignment.patient.patientId}
                    </div>
                  </div>
                </Link>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              {assignment.test ? (
                <Link
                  href={`/tests/${assignment.testId}`}
                  className="font-medium text-primary hover:underline"
                >
                  {assignment.test.name}
                </Link>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              {assignment.admin ? (
                <Link
                  href={`/users/${assignment.adminId}`}
                  className="text-sm text-primary hover:underline"
                >
                  {assignment.admin.fullName || assignment.admin.email}
                </Link>
              ) : (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  Unassigned
                </span>
              )}
            </TableCell>
            <TableCell>
              <AssignmentStatusBadge status={assignment.status} />
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {formatAssignmentDateShort(assignment.assignedAt)}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {formatAssignmentDateShort(assignment.completedAt)}
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-2">
                <Link href={`/assignments/${assignment.id}`}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View</span>
                  </Button>
                </Link>
                <HasRole allowedRoles={[UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN]}>
                  {onReassign && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => onReassign(assignment.id)}
                      disabled={assignment.status === 'SUBMITTED'}
                    >
                      <UserCog className="h-4 w-4" />
                      <span className="sr-only">Reassign</span>
                    </Button>
                  )}
                </HasRole>
                <HasRole allowedRoles={[UserRole.TEST_TECHNICIAN, UserRole.LAB_TECHNICIAN]}>
                  {onUpdateStatus && assignment.adminId && (
                    <>
                      {(assignment.status === 'PENDING' || assignment.status === 'ASSIGNED' || assignment.status === 'IN_PROGRESS') && (
                        <Link href={`/assignments/${assignment.id}/result`}>
                          <Button
                            variant="primary"
                            size="sm"
                            className="h-8 px-2 flex items-center gap-1"
                          >
                            <FlaskConical className="h-4 w-4" />
                            <span className="text-xs">Enter Result</span>
                          </Button>
                        </Link>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onUpdateStatus(assignment.id)}
                        disabled={assignment.status === 'SUBMITTED'}
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span className="sr-only">Update Status</span>
                      </Button>
                    </>
                  )}
                </HasRole>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

