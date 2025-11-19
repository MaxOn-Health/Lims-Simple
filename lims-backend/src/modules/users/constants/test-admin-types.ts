export const TEST_TECHNICIAN_TYPES = [
  'audiometry',
  'xray',
  'eye_test',
  'pft',
  'ecg',
] as const;

export type TestTechnicianType = (typeof TEST_TECHNICIAN_TYPES)[number];

export function isValidTestTechnicianType(value: string): boolean {
  return TEST_TECHNICIAN_TYPES.includes(value as TestTechnicianType);
}

// Legacy aliases for backward compatibility during migration
export const TEST_ADMIN_TYPES = TEST_TECHNICIAN_TYPES;
export type TestAdminType = TestTechnicianType;
export const isValidTestAdminType = isValidTestTechnicianType;

