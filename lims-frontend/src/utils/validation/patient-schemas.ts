import { z } from 'zod';
import { Gender, PaymentStatus } from '@/types/patient.types';

// Contact number validation: allows +, digits, spaces, hyphens, parentheses
const contactNumberRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;

export const createPatientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must not exceed 255 characters'),
  age: z
    .number()
    .int('Age must be an integer')
    .min(1, 'Age must be a positive integer')
    .max(150, 'Age must not exceed 150'),
  gender: z.nativeEnum(Gender, {
    errorMap: () => ({ message: 'Gender must be MALE, FEMALE, or OTHER' }),
  }),
  contactNumber: z
    .string()
    .min(1, 'Contact number is required')
    .max(20, 'Contact number must not exceed 20 characters')
    .regex(contactNumberRegex, 'Invalid contact number format'),
  email: z.union([z.string().email('Email must be a valid email address'), z.literal('')]).optional(),
  employeeId: z.string().max(100, 'Employee ID must not exceed 100 characters').optional().or(z.literal('')),
  companyName: z.string().max(255, 'Company name must not exceed 255 characters').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  projectId: z.string().uuid('Project ID must be a valid UUID').optional().or(z.literal('')),
  packageId: z.string().uuid('Package ID must be a valid UUID').optional().or(z.literal('')),
  addonTestIds: z.array(z.string().uuid('Each test ID must be a valid UUID')).optional(),
}).refine(
  (data) => {
    // Either packageId or at least one test must be provided
    const hasPackage = data.packageId && data.packageId !== '';
    const hasTests = data.addonTestIds && data.addonTestIds.length > 0;
    return hasPackage || hasTests;
  },
  {
    message: 'Either a package must be selected or at least one test must be selected',
    path: ['packageId'], // Error will show on packageId field
  }
);

export const updatePatientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must not exceed 255 characters').optional(),
  age: z
    .number()
    .int('Age must be an integer')
    .min(1, 'Age must be a positive integer')
    .max(150, 'Age must not exceed 150')
    .optional(),
  gender: z.nativeEnum(Gender, {
    errorMap: () => ({ message: 'Gender must be MALE, FEMALE, or OTHER' }),
  }).optional(),
  contactNumber: z
    .string()
    .min(1, 'Contact number is required')
    .max(20, 'Contact number must not exceed 20 characters')
    .regex(contactNumberRegex, 'Invalid contact number format')
    .optional(),
  email: z.union([z.string().email('Email must be a valid email address'), z.literal('')]).optional(),
  employeeId: z.string().max(100, 'Employee ID must not exceed 100 characters').optional().or(z.literal('')),
  companyName: z.string().max(255, 'Company name must not exceed 255 characters').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  addonTestIds: z.array(z.string().uuid('Each addon test ID must be a valid UUID')).optional(),
});

export const updatePaymentSchema = z
  .object({
    paymentStatus: z.nativeEnum(PaymentStatus, {
      errorMap: () => ({ message: 'Payment status must be PENDING, PAID, or PARTIAL' }),
    }),
    paymentAmount: z
      .number()
      .min(0, 'Payment amount must be a positive number')
      .refine((val) => Number(val.toFixed(2)) === val, {
        message: 'Payment amount must have at most 2 decimal places',
      }),
    totalPrice: z.number().min(0),
  })
  .refine(
    (data) => {
      if (data.paymentStatus === PaymentStatus.PAID) {
        return data.paymentAmount === data.totalPrice;
      }
      return true;
    },
    {
      message: 'Payment amount must equal total price for PAID status',
      path: ['paymentAmount'],
    }
  )
  .refine(
    (data) => {
      if (data.paymentStatus === PaymentStatus.PARTIAL) {
        return data.paymentAmount < data.totalPrice && data.paymentAmount > 0;
      }
      return true;
    },
    {
      message: 'Payment amount must be less than total price and greater than 0 for PARTIAL status',
      path: ['paymentAmount'],
    }
  )
  .refine(
    (data) => {
      if (data.paymentStatus === PaymentStatus.PENDING) {
        return data.paymentAmount === 0;
      }
      return true;
    },
    {
      message: 'Payment amount must be 0 for PENDING status',
      path: ['paymentAmount'],
    }
  );

