import { z } from 'zod';

export const createPackageSchema = z.object({
  name: z.string().min(1, 'Package name is required').max(255, 'Name must not exceed 255 characters'),
  description: z.string().optional(),
  price: z
    .number({
      required_error: 'Price is required',
      invalid_type_error: 'Price must be a number',
    })
    .min(0, 'Price must be a positive number')
    .refine((val) => {
      const decimalPlaces = (val.toString().split('.')[1] || '').length;
      return decimalPlaces <= 2;
    }, 'Price must have at most 2 decimal places'),
  validityDays: z
    .number({
      required_error: 'Validity days is required',
      invalid_type_error: 'Validity days must be a number',
    })
    .int('Validity days must be an integer')
    .min(1, 'Validity days must be a positive integer')
    .default(365),
});

export const updatePackageSchema = z.object({
  name: z.string().min(1, 'Package name is required').max(255, 'Name must not exceed 255 characters').optional(),
  description: z.string().optional(),
  price: z
    .number({
      invalid_type_error: 'Price must be a number',
    })
    .min(0, 'Price must be a positive number')
    .refine((val) => {
      const decimalPlaces = (val.toString().split('.')[1] || '').length;
      return decimalPlaces <= 2;
    }, 'Price must have at most 2 decimal places')
    .optional(),
  validityDays: z
    .number({
      invalid_type_error: 'Validity days must be a number',
    })
    .int('Validity days must be an integer')
    .min(1, 'Validity days must be a positive integer')
    .optional(),
  isActive: z.boolean().optional(),
});

export type CreatePackageFormData = z.infer<typeof createPackageSchema>;
export type UpdatePackageFormData = z.infer<typeof updatePackageSchema>;

