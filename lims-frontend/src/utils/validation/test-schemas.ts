import { z } from 'zod';
import { TestCategory, TestFieldType, TEST_FIELD_TYPES } from '@/types/test.types';

export const testFieldSchema = z
  .object({
    field_name: z.string().min(1, 'Field name is required'),
    field_type: z.nativeEnum(TestFieldType, {
      errorMap: () => ({ message: 'Please select a valid field type' }),
    }),
    required: z.boolean(),
    options: z.array(z.string()).nullable(),
    unit: z.string().max(50, 'Unit must not exceed 50 characters').nullable().optional(),
    normalRangeMin: z
      .number({
        invalid_type_error: 'Must be a number',
      })
      .nullable()
      .optional(),
    normalRangeMax: z
      .number({
        invalid_type_error: 'Must be a number',
      })
      .nullable()
      .optional(),
  })
  .refine(
    (data) => {
      if (data.field_type === TestFieldType.SELECT) {
        return data.options !== null && Array.isArray(data.options) && data.options.length > 0;
      }
      return true;
    },
    {
      message: 'Options are required for select field type',
      path: ['options'],
    }
  )
  .refine(
    (data) => {
      if (
        data.normalRangeMin !== undefined &&
        data.normalRangeMin !== null &&
        data.normalRangeMax !== undefined &&
        data.normalRangeMax !== null
      ) {
        return data.normalRangeMax >= data.normalRangeMin;
      }
      return true;
    },
    {
      message: 'Max must be >= min',
      path: ['normalRangeMax'],
    }
  );

export const createTestSchema = z.object({
  name: z.string().min(1, 'Test name is required').max(255, 'Name must not exceed 255 characters'),
  description: z.string().optional(),
  category: z.nativeEnum(TestCategory, {
    errorMap: () => ({ message: 'Please select a valid category' }),
  }),
  adminRole: z.string().min(1, 'Admin role is required'),
  testFields: z
    .array(testFieldSchema)
    .min(1, 'At least one test field is required'),
});

export const updateTestSchema = z.object({
  name: z.string().min(1, 'Test name is required').max(255, 'Name must not exceed 255 characters').optional(),
  description: z.string().optional(),
  category: z.nativeEnum(TestCategory, {
    errorMap: () => ({ message: 'Please select a valid category' }),
  }).optional(),
  adminRole: z.string().min(1, 'Admin role is required').optional(),
  testFields: z.array(testFieldSchema).optional(),
  isActive: z.boolean().optional(),
});

export type CreateTestFormData = z.infer<typeof createTestSchema>;
export type UpdateTestFormData = z.infer<typeof updateTestSchema>;
export type TestFieldFormData = z.infer<typeof testFieldSchema>;

