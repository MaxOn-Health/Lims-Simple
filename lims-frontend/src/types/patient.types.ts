export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
}

export interface PatientPackage {
  id: string;
  packageId: string | null;
  packageName?: string | null;
  addonTestIds: string[];
  totalPrice: number;
  paymentStatus: PaymentStatus;
  paymentAmount: number;
  registeredBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Patient {
  id: string;
  patientId: string;
  name: string;
  age: number;
  gender: Gender;
  contactNumber: string;
  email: string | null;
  employeeId: string | null;
  companyName: string | null;
  address: string | null;
  projectId: string | null;
  createdAt: Date;
  updatedAt: Date;
  patientPackages?: PatientPackage[];
}

export interface CreatePatientRequest {
  name: string;
  age: number;
  gender: Gender;
  contactNumber: string;
  email?: string;
  employeeId?: string;
  companyName?: string;
  address?: string;
  projectId?: string;
  packageId?: string;
  addonTestIds?: string[];
}

export interface UpdatePatientRequest {
  name?: string;
  age?: number;
  gender?: Gender;
  contactNumber?: string;
  email?: string;
  employeeId?: string;
  companyName?: string;
  address?: string;
  addonTestIds?: string[];
}

export interface UpdatePaymentRequest {
  paymentStatus: PaymentStatus;
  paymentAmount: number;
}

export interface QueryPatientsParams {
  page?: number;
  limit?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  paymentStatus?: PaymentStatus;
  packageId?: string;
  projectId?: string;
}

export interface PaginatedPatientsResponse {
  data: Patient[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TestProgress {
  testId: string;
  testName: string;
  assignmentId?: string | null;
  assignmentStatus?: string | null;
  hasResult: boolean;
  isMissing: boolean;
}

export interface PatientProgress extends Patient {
  testProgress: TestProgress[];
  totalTestsExpected: number;
  testsAssigned: number;
  testsCompleted: number;
  missingTests: number;
  overallProgress: number;
  hasMissingItems: boolean;
  bloodSampleStatus?: string | null;
  bloodSampleMissing: boolean;
}

export interface PaginatedPatientProgressResponse {
  data: PatientProgress[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

