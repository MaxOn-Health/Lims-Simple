export enum BloodSampleStatus {
  COLLECTED = 'COLLECTED',
  IN_LAB = 'IN_LAB',
  TESTED = 'TESTED',
  COMPLETED = 'COMPLETED',
}

export const BLOOD_SAMPLE_STATUSES = Object.values(BloodSampleStatus);

export function isValidBloodSampleStatus(value: string): boolean {
  return BLOOD_SAMPLE_STATUSES.includes(value as BloodSampleStatus);
}





