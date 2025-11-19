export enum TestCategory {
  ON_SITE = 'on_site',
  LAB = 'lab',
}

export const TEST_CATEGORIES = Object.values(TestCategory);

export function isValidTestCategory(value: string): boolean {
  return TEST_CATEGORIES.includes(value as TestCategory);
}

