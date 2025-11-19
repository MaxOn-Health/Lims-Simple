import { z } from 'zod';
import { AUDIOMETRY_DB_MIN, AUDIOMETRY_DB_MAX, AUDIOMETRY_FREQUENCIES, getAudiometryFieldName } from '@/utils/constants/audiometry.constants';

/**
 * Zod schema for a single audiometry DB value
 */
const audiometryDbValueSchema = z
  .number({
    invalid_type_error: 'DB value must be a number',
  })
  .min(AUDIOMETRY_DB_MIN, {
    message: `DB value must be at least ${AUDIOMETRY_DB_MIN}`,
  })
  .max(AUDIOMETRY_DB_MAX, {
    message: `DB value must be at most ${AUDIOMETRY_DB_MAX}`,
  })
  .optional();

/**
 * Generate Zod schema for audiometry result values
 * Creates validation for all frequency/ear combinations
 */
export function createAudiometryResultValuesSchema() {
  const shape: Record<string, z.ZodTypeAny> = {};

  // Generate fields for both ears and all frequencies
  ['right', 'left'].forEach((ear) => {
    AUDIOMETRY_FREQUENCIES.forEach((frequency) => {
      const fieldName = getAudiometryFieldName(ear as 'right' | 'left', frequency);
      shape[fieldName] = audiometryDbValueSchema;
    });
  });

  return z.object(shape);
}

/**
 * Zod schema for complete audiometry result submission
 */
export const audiometryResultSchema = z.object({
  resultValues: createAudiometryResultValuesSchema(),
  notes: z.string().optional(),
});

export type AudiometryResultFormData = z.infer<typeof audiometryResultSchema>;





