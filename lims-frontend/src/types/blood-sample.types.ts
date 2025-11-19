import { Gender } from './patient.types';
import { Result } from './result.types';

export enum BloodSampleStatus {
  COLLECTED = 'COLLECTED',
  IN_LAB = 'IN_LAB',
  TESTED = 'TESTED',
  COMPLETED = 'COMPLETED',
}

export interface PatientNested {
  id: string;
  patientId: string;
  name: string;
  age: number;
  gender: Gender;
  contactNumber: string;
}

export interface UserNested {
  id: string;
  email: string;
  fullName: string;
}

export interface BloodSample {
  id: string;
  patientId: string;
  sampleId: string;
  collectedAt: Date;
  collectedBy: string;
  status: BloodSampleStatus;
  testedAt: Date | null;
  testedBy: string | null;
  assignmentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  patient: PatientNested;
  collectedByUser: UserNested;
  testedByUser: UserNested | null;
}

export interface RegisterBloodSampleRequest {
  patientId: string;
}

export interface RegisterBloodSampleResponse {
  id: string;
  sampleId: string;
  passcode: string;
  patientId: string;
  collectedAt: Date;
}

export interface AccessBloodSampleRequest {
  sampleId: string;
  passcode: string;
}

export interface UpdateBloodSampleStatusRequest {
  status: BloodSampleStatus;
}

export interface SubmitBloodTestResultRequest {
  resultValues: Record<string, any>;
  notes?: string;
}

export interface QueryBloodSamplesParams {
  status?: BloodSampleStatus;
  page?: number;
  limit?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  patientId?: string;
}

