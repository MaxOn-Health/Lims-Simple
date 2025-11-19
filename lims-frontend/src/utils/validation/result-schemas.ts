import { z } from 'zod';
import { TestField, TestFieldType } from '@/types/test.types';
import { SubmitResultRequest, UpdateResultRequest } from '@/types/result.types';

/**
 * Generate a Zod schema for result values based on test fields
 */
export function generateResultValuesSchema(testFields: TestField[], normalRangeMin?: number | null, normalRangeMax?: number | null): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};

  testFields.forEach((field) => {
    let fieldSchema: z.ZodTypeAny;

    switch (field.field_type) {
      case TestFieldType.NUMBER:
        fieldSchema = z.number({
          required_error: `${field.field_name} is required`,
          invalid_type_error: `${field.field_name} must be a number`,
        });
        
        // Add normal range validation if applicable
        if (normalRangeMin !== null && normalRangeMin !== undefined && normalRangeMax !== null && normalRangeMax !== undefined) {
          fieldSchema = fieldSchema
            .min(normalRangeMin, {
              message: `${field.field_name} must be at least ${normalRangeMin}`,
            })
            .max(normalRangeMax, {
              message: `${field.field_name} must be at most ${normalRangeMax}`,
            });
        }
        break;

      case TestFieldType.TEXT:
        fieldSchema = z.string({
          required_error: `${field.field_name} is required`,
          invalid_type_error: `${field.field_name} must be a string`,
        }).min(1, `${field.field_name} cannot be empty`);
        break;

      case TestFieldType.SELECT:
        if (!field.options || field.options.length === 0) {
          throw new Error(`Select field ${field.field_name} must have options`);
        }
        fieldSchema = z.enum(field.options as [string, ...string[]], {
          errorMap: () => ({
            message: `${field.field_name} must be one of: ${field.options?.join(', ')}`,
          }),
        });
        break;

      case TestFieldType.BOOLEAN:
        fieldSchema = z.boolean({
          required_error: `${field.field_name} is required`,
          invalid_type_error: `${field.field_name} must be a boolean`,
        });
        break;

      case TestFieldType.DATE:
        fieldSchema = z.union([
          z.string().datetime(),
          z.date(),
        ]).refine(
          (val) => {
            if (typeof val === 'string') {
              return !isNaN(Date.parse(val));
            }
            return val instanceof Date;
          },
          {
            message: `${field.field_name} must be a valid date`,
          }
        );
        break;

      case TestFieldType.FILE:
        // File uploads are handled separately, store as string (URL or file ID)
        fieldSchema = z.string({
          required_error: `${field.field_name} is required`,
          invalid_type_error: `${field.field_name} must be a string`,
        });
        break;

      default:
        fieldSchema = z.any();
    }

    // Make optional if not required
    if (!field.required) {
      fieldSchema = fieldSchema.optional();
    }

    shape[field.field_name] = fieldSchema;
  });

  return z.object(shape);
}

/**
 * Create submit result schema with dynamic result values validation
 */
export function createSubmitResultSchema(testFields: TestField[], normalRangeMin?: number | null, normalRangeMax?: number | null) {
  return z.object({
    assignmentId: z.string().uuid('Assignment ID must be a valid UUID'),
    resultValues: generateResultValuesSchema(testFields, normalRangeMin, normalRangeMax),
    notes: z.string().optional(),
  }) as z.ZodType<SubmitResultRequest>;
}

/**
 * Create update result schema with dynamic result values validation
 */
export function createUpdateResultSchema(testFields: TestField[], normalRangeMin?: number | null, normalRangeMax?: number | null) {
  return z.object({
    resultValues: generateResultValuesSchema(testFields, normalRangeMin, normalRangeMax).optional(),
    notes: z.string().optional(),
  }) as z.ZodType<UpdateResultRequest>;
}

