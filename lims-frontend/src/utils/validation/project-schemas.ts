import { z } from 'zod';

const campSettingsSchema = z.object({
  autoGeneratePatientIds: z.boolean().optional(),
  patientIdPrefix: z.string().max(20, 'Patient ID prefix must not exceed 20 characters').optional(),
  requireEmployeeId: z.boolean().optional(),
  defaultPackageId: z.string().uuid('Default package ID must be a valid UUID').optional(),
}).optional();

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Name must not exceed 100 characters'),
  description: z.string().min(1, 'Description is required').max(255, 'Description must not exceed 255 characters'),
  companyName: z.string().max(255, 'Company name must not exceed 255 characters').optional(),
  contactPerson: z.string().max(100, 'Contact person must not exceed 100 characters').optional(),
  contactNumber: z.string().max(20, 'Contact number must not exceed 20 characters').optional(),
  contactEmail: z.string().email('Invalid email format').max(255, 'Email must not exceed 255 characters').optional(),
  campDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD').optional(),
  campLocation: z.string().max(255, 'Camp location must not exceed 255 characters').optional(),
  campSettings: campSettingsSchema,
  notes: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Name must not exceed 100 characters').optional(),
  description: z.string().min(1, 'Description is required').max(255, 'Description must not exceed 255 characters').optional(),
  companyName: z.string().max(255, 'Company name must not exceed 255 characters').optional(),
  contactPerson: z.string().max(100, 'Contact person must not exceed 100 characters').optional(),
  contactNumber: z.string().max(20, 'Contact number must not exceed 20 characters').optional(),
  contactEmail: z.string().email('Invalid email format').max(255, 'Email must not exceed 255 characters').optional(),
  campDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD').optional(),
  campLocation: z.string().max(255, 'Camp location must not exceed 255 characters').optional(),
  campSettings: campSettingsSchema,
  notes: z.string().optional(),
});

export type CreateProjectFormData = z.infer<typeof createProjectSchema>;
export type UpdateProjectFormData = z.infer<typeof updateProjectSchema>;

