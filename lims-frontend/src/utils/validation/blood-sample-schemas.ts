import { z } from 'zod';
import { BloodSampleStatus } from '@/types/blood-sample.types';

export const registerBloodSampleSchema = z.object({
  patientId: z.string().uuid('Patient ID must be a valid UUID'),
});

export const accessBloodSampleSchema = z.object({
  sampleId: z
    .string()
    .min(1, 'Sample ID is required')
    .regex(/^BL-\d{8}-\d{4}$/, 'Sample ID must be in format BL-YYYYMMDD-XXXX'),
  passcode: z
    .string()
    .length(6, 'Passcode must be exactly 6 digits')
    .regex(/^\d{6}$/, 'Passcode must be a 6-digit number'),
});

export const updateStatusSchema = z.object({
  status: z.nativeEnum(BloodSampleStatus, {
    errorMap: () => ({ message: 'Status must be COLLECTED, IN_LAB, TESTED, or COMPLETED' }),
  }),
});

export const submitBloodTestResultSchema = z.object({
  resultValues: z.record(z.any(), 'Result values must be a valid object'),
  notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional(),
});

