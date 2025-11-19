import { z } from 'zod';
import {
  getVisionFieldName,
  getEyeParameterFieldName,
  getEyeHealthFieldName,
  EYE_HEALTH_LABELS,
} from '@/utils/constants/eye.constants';

/**
 * Zod schema for vision value (string or number)
 */
const visionValueSchema = z
  .union([z.string(), z.number()])
  .optional()
  .transform((val) => {
    if (val === null || val === undefined || val === '') return undefined;
    if (typeof val === 'string' && val.trim() === '') return undefined;
    return val;
  });

/**
 * Zod schema for eye parameter value (string or number)
 */
const eyeParameterValueSchema = z
  .union([z.string(), z.number()])
  .optional()
  .transform((val) => {
    if (val === null || val === undefined || val === '') return undefined;
    if (typeof val === 'string' && val.trim() === '') return undefined;
    return val;
  });

/**
 * Zod schema for eye health field (string)
 */
const eyeHealthValueSchema = z.string().optional();

/**
 * Generate Zod schema for eye test result values
 * Creates validation for all vision, parameter, and health field combinations
 */
export function createEyeTestResultValuesSchema() {
  const shape: Record<string, z.ZodTypeAny> = {};

  // Generate fields for vision tests (distance and near, right and left, with/without glass)
  const visionTypes: Array<'distance' | 'near'> = ['distance', 'near'];
  const eyes: Array<'right' | 'left'> = ['right', 'left'];
  const glassTypes: Array<'without_glass' | 'with_glass'> = ['without_glass', 'with_glass'];

  visionTypes.forEach((visionType) => {
    eyes.forEach((eye) => {
      glassTypes.forEach((glassType) => {
        const fieldName = getVisionFieldName(visionType, eye, glassType);
        shape[fieldName] = visionValueSchema;
      });
    });
  });

  // Generate fields for eye parameters (SPH, CYL, AXIS, ADD, VISION for right and left)
  const parameters: Array<'sph' | 'cyl' | 'axis' | 'add' | 'vision'> = [
    'sph',
    'cyl',
    'axis',
    'add',
    'vision',
  ];

  parameters.forEach((parameter) => {
    eyes.forEach((eye) => {
      const fieldName = getEyeParameterFieldName(parameter, eye);
      shape[fieldName] = eyeParameterValueSchema;
    });
  });

  // Generate fields for eye health
  Object.keys(EYE_HEALTH_LABELS).forEach((key) => {
    const fieldName = getEyeHealthFieldName(key as keyof typeof EYE_HEALTH_LABELS);
    shape[fieldName] = eyeHealthValueSchema;
  });

  // Vision status fields (optional boolean or string)
  shape['normal_vision'] = z.union([z.boolean(), z.string()]).optional();
  shape['near_normal_vision'] = z.union([z.boolean(), z.string()]).optional();

  return z.object(shape);
}

/**
 * Zod schema for complete eye test result submission
 */
export const eyeTestResultSchema = z.object({
  resultValues: createEyeTestResultValuesSchema(),
  notes: z.string().optional(),
});

export type EyeTestResultFormData = z.infer<typeof eyeTestResultSchema>;

