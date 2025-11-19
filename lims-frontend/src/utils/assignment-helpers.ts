import { AssignmentStatus, Assignment } from '@/types/assignment.types';
import { useAuthStore } from '@/store/auth.store';

export function getAssignmentStatusColor(status: AssignmentStatus): string {
  switch (status) {
    case AssignmentStatus.PENDING:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    case AssignmentStatus.ASSIGNED:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case AssignmentStatus.IN_PROGRESS:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case AssignmentStatus.COMPLETED:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case AssignmentStatus.SUBMITTED:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
}

export function getAssignmentStatusVariant(
  status: AssignmentStatus
): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case AssignmentStatus.PENDING:
      return 'secondary';
    case AssignmentStatus.ASSIGNED:
      return 'default';
    case AssignmentStatus.IN_PROGRESS:
      return 'outline';
    case AssignmentStatus.COMPLETED:
      return 'default';
    case AssignmentStatus.SUBMITTED:
      return 'default';
    default:
      return 'secondary';
  }
}

export function getAssignmentStatusLabel(status: AssignmentStatus): string {
  switch (status) {
    case AssignmentStatus.PENDING:
      return 'Pending';
    case AssignmentStatus.ASSIGNED:
      return 'Assigned';
    case AssignmentStatus.IN_PROGRESS:
      return 'In Progress';
    case AssignmentStatus.COMPLETED:
      return 'Completed';
    case AssignmentStatus.SUBMITTED:
      return 'Submitted';
    default:
      return status;
  }
}

export function getValidStatusTransitions(
  currentStatus: AssignmentStatus
): AssignmentStatus[] {
  const validTransitions: Record<AssignmentStatus, AssignmentStatus[]> = {
    [AssignmentStatus.PENDING]: [AssignmentStatus.ASSIGNED],
    [AssignmentStatus.ASSIGNED]: [AssignmentStatus.IN_PROGRESS],
    [AssignmentStatus.IN_PROGRESS]: [AssignmentStatus.COMPLETED],
    [AssignmentStatus.COMPLETED]: [AssignmentStatus.SUBMITTED],
    [AssignmentStatus.SUBMITTED]: [], // No transitions from SUBMITTED
  };

  return validTransitions[currentStatus] || [];
}

export function canReassign(assignment: Assignment): boolean {
  // Can reassign if status is not SUBMITTED
  return assignment.status !== AssignmentStatus.SUBMITTED;
}

export function canUpdateStatus(assignment: Assignment, userId: string): boolean {
  // Can update status if:
  // 1. User is the assigned admin
  // 2. Status is not SUBMITTED
  return (
    assignment.adminId === userId &&
    assignment.status !== AssignmentStatus.SUBMITTED
  );
}

export function formatAssignmentDate(date: Date | null | string): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatAssignmentDateShort(date: Date | null | string): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

