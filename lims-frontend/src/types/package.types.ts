export interface PackageTest {
  id: string;
  testId: string;
  testName: string;
  testPrice: number | null;
  createdAt: Date;
}

export interface Package {
  id: string;
  name: string;
  description: string | null;
  price: number;
  validityDays: number;
  isActive: boolean;
  tests: PackageTest[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePackageRequest {
  name: string;
  description?: string;
  price: number;
  validityDays?: number;
}

export interface UpdatePackageRequest {
  name?: string;
  description?: string;
  price?: number;
  validityDays?: number;
  isActive?: boolean;
}

export interface QueryPackagesParams {
  isActive?: boolean;
}

export interface AddTestToPackageRequest {
  testId: string;
  testPrice?: number;
}

export interface PaginatedPackagesResponse {
  data: Package[];
  total: number;
  page: number;
  limit: number;
}

