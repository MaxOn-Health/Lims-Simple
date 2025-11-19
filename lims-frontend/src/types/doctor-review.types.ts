import { Patient } from './patient.types';
import { Result } from './result.types';
import { AssignmentStatus } from './assignment.types';
import { BloodSample } from './blood-sample.types';

export enum ReviewStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  SIGNED = 'SIGNED',
}

export interface Review {
  id: string;
  patientId: string;
  doctorId: string;
  remarks: string | null;
  reviewedAt: Date | null;
  signedAt: Date | null;
  passkeyVerified: boolean;
  isSigned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientReview {
  patient: Patient;
  status: ReviewStatus;
  reviewId?: string;
  reviewedAt?: Date;
  signedAt?: Date;
  totalTests: number;
  submittedTests: number;
}

export interface PatientResults {
  patient: Patient;
  results: Result[];
  assignments: Array<{
    id: string;
    patientId: string;
    testId: string;
    adminId: string | null;
    status: AssignmentStatus;
    test?: {
      id: string;
      name: string;
      category: string;
    };
  }>;
  bloodSample?: BloodSample;
  review?: {
    id: string;
    remarks: string | null;
    reviewedAt: Date | null;
    signedAt: Date | null;
    isSigned: boolean;
  };
}

export interface CreateReviewRequest {
  patientId: string;
  remarks?: string;
}

export interface SignReportRequest {
  patientId: string;
  passkeyCredential: any; // WebAuthn credential object
}

export interface QueryPatientsParams {
  status?: ReviewStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedPatientsResponse {
  data: PatientReview[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QuerySignedReportsParams {
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}

