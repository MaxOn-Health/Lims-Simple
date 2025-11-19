import { z } from 'zod';
import { AssignmentStatus } from '@/types/assignment.types';

export const createAssignmentSchema = z.object({
  patientId: z.string().uuid('Patient ID must be a valid UUID'),
  testId: z.string().uuid('Test ID must be a valid UUID'),
  adminId: z.string().uuid('Admin ID must be a valid UUID').optional(),
});

export const reassignAssignmentSchema = z.object({
  adminId: z.string().uuid('Admin ID must be a valid UUID'),
});

export const updateAssignmentStatusSchema = z
  .object({
    status: z.nativeEnum(AssignmentStatus, {
      errorMap: () => ({
        message:
          'Status must be PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, or SUBMITTED',
      }),
    }),
    currentStatus: z.nativeEnum(AssignmentStatus).optional(),
  })
  .refine(
    (data) => {
      if (!data.currentStatus) return true;

      const validTransitions: Record<AssignmentStatus, AssignmentStatus[]> = {
        [AssignmentStatus.PENDING]: [AssignmentStatus.ASSIGNED],
        [AssignmentStatus.ASSIGNED]: [AssignmentStatus.IN_PROGRESS],
        [AssignmentStatus.IN_PROGRESS]: [AssignmentStatus.COMPLETED],
        [AssignmentStatus.COMPLETED]: [AssignmentStatus.SUBMITTED],
        [AssignmentStatus.SUBMITTED]: [], // No transitions from SUBMITTED
      };

      const allowed = validTransitions[data.currentStatus] || [];
      return allowed.includes(data.status);
    },
    {
      message: 'Invalid status transition',
      path: ['status'],
    }
  );

