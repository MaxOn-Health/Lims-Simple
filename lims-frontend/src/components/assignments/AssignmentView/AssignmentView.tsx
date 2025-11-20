'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Assignment } from '@/types/assignment.types';
import { Button } from '@/components/common/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AssignmentStatusBadge } from '../AssignmentStatusBadge/AssignmentStatusBadge';
import { ReassignModal } from '../ReassignModal/ReassignModal';
import { UpdateStatusModal } from '../UpdateStatusModal/UpdateStatusModal';
import { HasRole } from '@/components/common/HasRole/HasRole';
import { UserRole } from '@/types/user.types';
import {
  formatAssignmentDate,
  canReassign,
  canUpdateStatus,
} from '@/utils/assignment-helpers';
import { useAuthStore } from '@/store/auth.store';
import { assignmentsService } from '@/services/api/assignments.service';
import { resultsService } from '@/services/api/results.service';
import { Result } from '@/types/result.types';
import { AssignmentStatus } from '@/types/assignment.types';
import { UserCog, RefreshCw, Eye, ExternalLink, FileText } from 'lucide-react';

interface AssignmentViewProps {
  assignment: Assignment;
  onUpdate?: () => void;
}

export const AssignmentView: React.FC<AssignmentViewProps> = ({
  assignment,
  onUpdate,
}) => {
  const { user } = useAuthStore();
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [updateStatusModalOpen, setUpdateStatusModalOpen] = useState(false);
  const [patientAssignments, setPatientAssignments] = useState<Assignment[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [isLoadingResult, setIsLoadingResult] = useState(false);

  useEffect(() => {
    if (assignment.patientId) {
      fetchPatientAssignments();
    }
    // Check if result exists for this assignment
    if (assignment.status === AssignmentStatus.COMPLETED || assignment.status === AssignmentStatus.SUBMITTED) {
      fetchResult();
    }
  }, [assignment.id, assignment.status]);

  const fetchPatientAssignments = async () => {
    try {
      const assignments = await assignmentsService.getAssignmentsByPatient(
        assignment.patientId
      );
      setPatientAssignments(assignments.filter((a) => a.id !== assignment.id));
    } catch (err) {
      // Silently fail - related assignments are optional
    }
  };

  const fetchResult = async () => {
    setIsLoadingResult(true);
    try {
      const resultData = await resultsService.getResultByAssignment(assignment.id);
      setResult(resultData);
    } catch (err: any) {
      // Result doesn't exist yet - this is fine
      if (err?.response?.status !== 404) {
        // Only log non-404 errors
        console.error('Failed to fetch result:', err);
      }
      setResult(null);
    } finally {
      setIsLoadingResult(false);
    }
  };

  const handleReassign = () => {
    setReassignModalOpen(false);
    if (onUpdate) {
      onUpdate();
    }
  };

  const handleStatusUpdate = () => {
    setUpdateStatusModalOpen(false);
    if (onUpdate) {
      onUpdate();
    }
  };

  const canReassignThis = canReassign(assignment);
  const canUpdateThisStatus = user ? canUpdateStatus(assignment, user.id) : false;

  return (
    <div className="space-y-6">
      {/* Assignment Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Status</span>
            <AssignmentStatusBadge status={assignment.status} />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Patient</p>
              {assignment.patient ? (
                <Link
                  href={`/patients/${assignment.patientId}`}
                  className="text-base font-semibold text-primary hover:underline mt-1 inline-block"
                >
                  {assignment.patient.name}
                  <span className="text-muted-foreground ml-2">
                    ({assignment.patient.patientId})
                  </span>
                </Link>
              ) : (
                <p className="text-base text-foreground mt-1">—</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Test</p>
              {assignment.test ? (
                <Link
                  href={`/tests/${assignment.testId}`}
                  className="text-base font-semibold text-primary hover:underline mt-1 inline-block"
                >
                  {assignment.test.name}
                </Link>
              ) : (
                <p className="text-base text-foreground mt-1">—</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Assigned Admin</p>
              {assignment.admin ? (
                <Link
                  href={`/users/${assignment.adminId}`}
                  className="text-base text-primary hover:underline mt-1 inline-block"
                >
                  {assignment.admin.fullName || assignment.admin.email}
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded mt-1 inline-block">
                  Unassigned
                </span>
              )}
            </div>
            {assignment.test && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Test Category</p>
                <p className="text-base text-foreground mt-1 capitalize">
                  {assignment.test.category}
                </p>
              </div>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Assigned Date</p>
              <p className="text-base text-foreground mt-1">
                {formatAssignmentDate(assignment.assignedAt)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Started Date</p>
              <p className="text-base text-foreground mt-1">
                {formatAssignmentDate(assignment.startedAt)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed Date</p>
              <p className="text-base text-foreground mt-1">
                {formatAssignmentDate(assignment.completedAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Related Data Card */}
      <Card>
        <CardHeader>
          <CardTitle>Related Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {patientAssignments.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Patient's Other Assignments
              </p>
              <div className="space-y-2">
                {patientAssignments.slice(0, 5).map((otherAssignment) => (
                  <Link
                    key={otherAssignment.id}
                    href={`/assignments/${otherAssignment.id}`}
                    className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50"
                  >
                    <div>
                      <span className="text-sm font-medium">
                        {otherAssignment.test?.name || 'Unknown Test'}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {otherAssignment.admin?.fullName || otherAssignment.admin?.email || 'Unassigned'}
                      </span>
                    </div>
                    <AssignmentStatusBadge status={otherAssignment.status} />
                  </Link>
                ))}
                {patientAssignments.length > 5 && (
                  <Link
                    href={`/patients/${assignment.patientId}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View all {patientAssignments.length} assignments →
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <HasRole allowedRoles={[UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN]}>
          {canReassignThis && (
            <Button
              variant="outline"
              onClick={() => setReassignModalOpen(true)}
            >
              <UserCog className="mr-2 h-4 w-4" />
              Reassign
            </Button>
          )}
        </HasRole>
        <HasRole allowedRoles={[UserRole.TEST_TECHNICIAN, UserRole.LAB_TECHNICIAN]}>
          {canUpdateThisStatus && (
            <Button
              variant="primary"
              onClick={() => setUpdateStatusModalOpen(true)}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Update Status
            </Button>
          )}
        </HasRole>
        <HasRole allowedRoles={[UserRole.TEST_TECHNICIAN, UserRole.LAB_TECHNICIAN]}>
          {(assignment.status === AssignmentStatus.IN_PROGRESS ||
            assignment.status === AssignmentStatus.ASSIGNED) &&
            !result && (
              <Link href={`/results/entry/${assignment.id}`}>
                <Button variant="primary">
                  <FileText className="mr-2 h-4 w-4" />
                  Submit Result
                </Button>
              </Link>
            )}
        </HasRole>
        {result && (
          <Link href={`/results/${result.id}`}>
            <Button variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              View Result
            </Button>
          </Link>
        )}
      </div>

      {/* Modals */}
      <ReassignModal
        isOpen={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        assignment={assignment}
        onSuccess={handleReassign}
      />
      <UpdateStatusModal
        isOpen={updateStatusModalOpen}
        onClose={() => setUpdateStatusModalOpen(false)}
        assignment={assignment}
        onSuccess={handleStatusUpdate}
      />
    </div>
  );
};

