export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  RECEPTIONIST = 'RECEPTIONIST',
  TEST_TECHNICIAN = 'TEST_TECHNICIAN',
  LAB_TECHNICIAN = 'LAB_TECHNICIAN',
  DOCTOR = 'DOCTOR',
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  testTechnicianType?: string | null;
  isActive: boolean;
  passkeyCredentialId?: string | null;
  passkeyPublicKey?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive?: boolean;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  testTechnicianType?: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  role?: UserRole;
  testTechnicianType?: string | null;
  isActive?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface QueryUsersParams {
  page?: number;
  limit?: number;
  role?: UserRole;
  search?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedUsersResponse {
  data: User[];
  meta: PaginationMeta;
}

export const TEST_TECHNICIAN_TYPES = [
  'audiometry',
  'xray',
  'eye_test',
  'pft',
  'ecg',
] as const;

export type TestTechnicianType = (typeof TEST_TECHNICIAN_TYPES)[number];

// Legacy aliases for backward compatibility during migration
export const TEST_ADMIN_TYPES = TEST_TECHNICIAN_TYPES;
export type TestAdminType = TestTechnicianType;
