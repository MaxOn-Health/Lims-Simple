export enum TestFieldType {
  NUMBER = 'number',
  TEXT = 'text',
  SELECT = 'select',
  BOOLEAN = 'boolean',
  DATE = 'date',
  FILE = 'file',
}

export const TEST_FIELD_TYPES = Object.values(TestFieldType);

export function isValidTestFieldType(value: string): boolean {
  return TEST_FIELD_TYPES.includes(value as TestFieldType);
}

