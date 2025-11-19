export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export const GENDER_ARRAY = Object.values(Gender);

export function isValidGender(gender: string): boolean {
  return GENDER_ARRAY.includes(gender as Gender);
}

