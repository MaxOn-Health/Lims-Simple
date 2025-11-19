/**
 * Eye test constants
 */

export type EyeType = 'right' | 'left';
export type VisionType = 'distance' | 'near';
export type GlassType = 'without_glass' | 'with_glass';
export type EyeParameterType = 'sph' | 'cyl' | 'axis' | 'add' | 'vision';

export const EYE_LABELS = {
  RIGHT: 'RIGHT',
  LEFT: 'LEFT',
} as const;

export const VISION_TYPE_LABELS = {
  DISTANCE: 'Distance vision',
  NEAR: 'Near vision',
} as const;

export const GLASS_TYPE_LABELS = {
  WITHOUT_GLASS: 'Without Glass',
  WITH_GLASS: 'With Glass',
} as const;

export const EYE_PARAMETER_LABELS = {
  SPH: 'SPH',
  CYL: 'CYL',
  AXIS: 'AXIS',
  ADD: 'ADD',
  VISION: 'VISION',
} as const;

export const EYE_HEALTH_LABELS = {
  EYE_LIDS: 'Eye lids',
  CONJUNCTIVA: 'Conjunctiva',
  CORNEA: 'CORNEA',
  PUPIL: 'Pupil',
  COLOUR_BLINDNESS: 'Colour Blindness',
} as const;

/**
 * Generate field name for vision test result
 */
export function getVisionFieldName(
  visionType: VisionType,
  eye: EyeType,
  glassType: GlassType
): string {
  return `${visionType}_vision_${eye}_${glassType}`;
}

/**
 * Generate field name for eye parameter result
 */
export function getEyeParameterFieldName(
  parameter: EyeParameterType,
  eye: EyeType
): string {
  return `${parameter}_${eye}`;
}

/**
 * Generate field name for eye health field
 */
export function getEyeHealthFieldName(field: keyof typeof EYE_HEALTH_LABELS): string {
  const fieldMap: Record<keyof typeof EYE_HEALTH_LABELS, string> = {
    EYE_LIDS: 'eye_lids',
    CONJUNCTIVA: 'conjunctiva',
    CORNEA: 'cornea',
    PUPIL: 'pupil',
    COLOUR_BLINDNESS: 'colour_blindness',
  };
  return fieldMap[field];
}

/**
 * Normal values for eye health fields
 */
export const NORMAL_EYE_HEALTH_VALUES = {
  eye_lids: 'Normal',
  conjunctiva: 'Normal',
  cornea: 'Normal',
  pupil: 'Normal',
  colour_blindness: 'Normal',
} as const;

