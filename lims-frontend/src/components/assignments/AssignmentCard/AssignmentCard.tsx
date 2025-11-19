'use client';

import React from 'react';
import Link from 'next/link';
import { Assignment, AssignmentStatus } from '@/types/assignment.types';
import { Button } from '@/components/common/Button/Button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AssignmentStatusBadge } from '../AssignmentStatusBadge/AssignmentStatusBadge';
import { formatAssignmentDateShort } from '@/utils/assignment-helpers';
import { Eye, Play, CheckCircle, FileText, UserCog, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AssignmentCardProps {
  assignment: Assignment;
  onStart?: (assignmentId: string) => void;
  onComplete?: (assignmentId: string) => void;
  onUpdateStatus?: (assignmentId: string) => void;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  onStart,
  onComplete,
  onUpdateStatus,
}) => {
  const router = useRouter();

  const handleStart = () => {
    if (onStart) {
      onStart(assignment.id);
    } else if (onUpdateStatus) {
      onUpdateStatus(assignment.id);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete(assignment.id);
    } else if (onUpdateStatus) {
      onUpdateStatus(assignment.id);
    }
  };

  const handleSubmitResult = () => {
    router.push(`/results/entry/${assignment.id}`);
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-border/50 flex flex-col h-full">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <Link
              href={`/assignments/${assignment.id}`}
              className="text-lg font-semibold text-foreground hover:text-primary transition-colors line-clamp-1 block"
            >
              {assignment.test?.name || 'Unknown Test'}
            </Link>
          </div>
          <AssignmentStatusBadge status={assignment.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 flex flex-col">
        {/* Patient Information - More Prominent */}
        {assignment.patient && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">Patient</p>
            </div>
            <Link
              href={`/patients/${assignment.patientId}`}
              className="block hover:text-primary transition-colors"
            >
              <p className="text-base font-semibold text-foreground line-clamp-1">
                {assignment.patient.name}
              </p>
              <p className="text-sm text-muted-foreground font-mono mt-0.5">
                {assignment.patient.patientId}
              </p>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 p-3 rounded-lg bg-muted/50">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Assigned Date
            </p>
            <p className="text-sm font-semibold text-foreground truncate">
              {formatAssignmentDateShort(assignment.assignedAt)}
            </p>
          </div>
          {assignment.completedAt && (
            <div className="space-y-1.5 p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Completed Date
              </p>
              <p className="text-sm font-semibold text-foreground truncate">
                {formatAssignmentDateShort(assignment.completedAt)}
              </p>
            </div>
          )}
        </div>

        <Separator className="my-2" />

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
              <UserCog className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Assigned To</p>
              <p className="text-sm font-semibold text-foreground truncate">
                {assignment.admin?.fullName || assignment.admin?.email || 'Unassigned'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t flex-shrink-0">
        <div className="flex flex-wrap gap-2 w-full">
          <Link href={`/assignments/${assignment.id}`} className="flex-1 min-w-[70px]">
            <Button variant="ghost" size="sm" fullWidth className="gap-1.5 text-xs">
              <Eye className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">View</span>
            </Button>
          </Link>
          {assignment.status === AssignmentStatus.ASSIGNED && (
            <Button
              variant="default"
              size="sm"
              onClick={handleStart}
              className="flex-1 min-w-[70px] gap-1.5 text-xs"
            >
              <Play className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Start</span>
            </Button>
          )}
          {assignment.status === AssignmentStatus.IN_PROGRESS && (
            <Button
              variant="default"
              size="sm"
              onClick={handleComplete}
              className="flex-1 min-w-[70px] gap-1.5 text-xs"
            >
              <CheckCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Complete</span>
            </Button>
          )}
          {assignment.status === AssignmentStatus.COMPLETED && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSubmitResult}
              className="flex-1 min-w-[100px] gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white"
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Enter Results</span>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

