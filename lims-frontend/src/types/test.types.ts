export enum TestCategory {
  ON_SITE = 'on_site',
  LAB = 'lab',
}

export enum TestFieldType {
  NUMBER = 'number',
  TEXT = 'text',
  SELECT = 'select',
  BOOLEAN = 'boolean',
  DATE = 'date',
  FILE = 'file',
}

export interface TestField {
  field_name: string;
  field_type: TestFieldType;
  required: boolean;
  options: string[] | null;
}

export interface Test {
  id: string;
  name: string;
  description: string | null;
  category: TestCategory;
  adminRole: string;
  normalRangeMin: number | null;
  normalRangeMax: number | null;
  unit: string | null;
  testFields: TestField[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTestRequest {
  name: string;
  description?: string;
  category: TestCategory;
  adminRole: string;
  normalRangeMin?: number;
  normalRangeMax?: number;
  unit?: string;
  testFields: TestField[];
}

export interface UpdateTestRequest {
  name?: string;
  description?: string;
  category?: TestCategory;
  adminRole?: string;
  normalRangeMin?: number;
  normalRangeMax?: number;
  unit?: string;
  testFields?: TestField[];
  isActive?: boolean;
}

export interface QueryTestsParams {
  category?: TestCategory;
  adminRole?: string;
  isActive?: boolean;
}

export interface PaginatedTestsResponse {
  data: Test[];
  total: number;
  page: number;
  limit: number;
}

export const TEST_CATEGORIES = Object.values(TestCategory);
export const TEST_FIELD_TYPES = Object.values(TestFieldType);

