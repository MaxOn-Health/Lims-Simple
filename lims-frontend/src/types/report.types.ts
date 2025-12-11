import { Patient } from './patient.types';

export enum ReportStatus {
  PENDING = 'PENDING',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface PatientInfo {
  id: string;
  patientId: string;
  name: string;
}

export interface DoctorReviewInfo {
  id: string;
  remarks: string | null;
  signedAt: Date | null;
}

export interface UserInfo {
  id: string;
  email: string;
  fullName: string;
}

export interface Report {
  id: string;
  patientId: string;
  reportNumber: string;
  doctorReviewId: string | null;
  status: ReportStatus;
  pdfUrl: string | null;
  generatedAt: Date | null;
  generatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  patient?: PatientInfo;
  doctorReview?: DoctorReviewInfo;
  generatedByUser?: UserInfo;
}

export interface ReportReadiness {
  isReady: boolean;
  details: {
    allAssignmentsSubmitted: boolean;
    allResultsExist: boolean;
    bloodTestCompleted: boolean;
    reviewExists: boolean;
    isSigned: boolean;
  };
}

export interface PaginatedReportsResponse {
  data: Report[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryReportsParams {
  page?: number;
  limit?: number;
  status?: ReportStatus;
  dateFrom?: string;
  dateTo?: string;
  patientId?: string;
  search?: string;
  projectId?: string;
}

export interface GenerateReportResponse {
  id: string;
  patientId: string;
  reportNumber: string;
  status: ReportStatus;
  pdfUrl: string | null;
  generatedAt: Date | null;
}

