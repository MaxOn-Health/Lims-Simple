/**
 * Audiometry test constants
 */

export const AUDIOMETRY_FREQUENCIES = [125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000] as const;

export type AudiometryFrequency = typeof AUDIOMETRY_FREQUENCIES[number];

export const AUDIOMETRY_DB_MIN = -10;
export const AUDIOMETRY_DB_MAX = 120;

export const EAR_LABELS = {
  RIGHT: 'RIGHT',
  LEFT: 'LEFT',
} as const;

export type EarType = 'right' | 'left';

/**
 * Hearing loss classification ranges (in DB HL)
 */
export const HEARING_LOSS_CLASSIFICATION = {
  NORMAL: { min: -10, max: 25, label: 'Normal Hearing', color: 'green' },
  MILD: { min: 26, max: 45, label: 'Mild Hearing Loss', color: 'yellow' },
  MODERATE: { min: 46, max: 65, label: 'Moderate Hearing Loss', color: 'orange' },
  SEVERE: { min: 66, max: 85, label: 'Severe Hearing Loss', color: 'red' },
  PROFOUND: { min: 86, max: Infinity, label: 'Profound Hearing Loss', color: 'red' },
} as const;

/**
 * Get hearing loss classification for a given DB value
 */
export function getHearingLossClassification(dbValue: number): typeof HEARING_LOSS_CLASSIFICATION[keyof typeof HEARING_LOSS_CLASSIFICATION] {
  if (dbValue >= HEARING_LOSS_CLASSIFICATION.NORMAL.min && dbValue <= HEARING_LOSS_CLASSIFICATION.NORMAL.max) {
    return HEARING_LOSS_CLASSIFICATION.NORMAL;
  }
  if (dbValue >= HEARING_LOSS_CLASSIFICATION.MILD.min && dbValue <= HEARING_LOSS_CLASSIFICATION.MILD.max) {
    return HEARING_LOSS_CLASSIFICATION.MILD;
  }
  if (dbValue >= HEARING_LOSS_CLASSIFICATION.MODERATE.min && dbValue <= HEARING_LOSS_CLASSIFICATION.MODERATE.max) {
    return HEARING_LOSS_CLASSIFICATION.MODERATE;
  }
  if (dbValue >= HEARING_LOSS_CLASSIFICATION.SEVERE.min && dbValue <= HEARING_LOSS_CLASSIFICATION.SEVERE.max) {
    return HEARING_LOSS_CLASSIFICATION.SEVERE;
  }
  return HEARING_LOSS_CLASSIFICATION.PROFOUND;
}

/**
 * Generate field name for audiometry result
 */
export function getAudiometryFieldName(ear: EarType, frequency: AudiometryFrequency): string {
  return `${ear}_${frequency}`;
}






