import { z } from 'zod';
import { UserRole } from '@/types/user.types';

export const createUserSchema = z
  .object({
    fullName: z.string().min(1, 'Full name is required').max(255),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    role: z.nativeEnum(UserRole),
    testTechnicianType: z.string().min(1, 'Test Technician Type is required').optional().nullable(),
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.role === UserRole.TEST_TECHNICIAN) {
        return !!data.testTechnicianType;
      }
      return true;
    },
    {
      message: 'Test Technician Type is required for TEST_TECHNICIAN role',
      path: ['testTechnicianType'],
    }
  );

export const updateUserSchema = z
  .object({
    fullName: z.string().min(1, 'Full name is required').max(255).optional(),
    email: z.string().email('Invalid email address').optional(),
    role: z.nativeEnum(UserRole).optional(),
    testTechnicianType: z.string().min(1).optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.role === UserRole.TEST_TECHNICIAN) {
        return !!data.testTechnicianType;
      }
      return true;
    },
    {
      message: 'Test Technician Type is required for TEST_TECHNICIAN role',
      path: ['testTechnicianType'],
    }
  );

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
