import { AssignmentStatus } from './assignment.types';
import { TestFieldType } from './test.types';

export type ResultStatus = 'NORMAL' | 'ABNORMAL';

export interface AssignmentInfo {
  id: string;
  patientId: string;
  testId: string;
  adminId: string | null;
  status: AssignmentStatus;
}

export interface TestInfo {
  id: string;
  name: string;
  category: string;
}

export interface PatientInfo {
  id: string;
  patientId: string;
  name: string;
}

export interface UserInfo {
  id: string;
  email: string;
  fullName: string;
}

export interface Result {
  id: string;
  assignmentId: string;
  resultValues: Record<string, any>;
  notes: string | null;
  enteredBy: string;
  enteredAt: Date;
  isVerified: boolean;
  verifiedBy: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  assignment?: AssignmentInfo;
  test?: TestInfo;
  patient?: PatientInfo;
  enteredByUser?: UserInfo;
  verifiedByUser?: UserInfo | null;
  warnings?: string[];
}

export interface SubmitResultRequest {
  assignmentId: string;
  resultValues: Record<string, any>;
  notes?: string;
}

export interface UpdateResultRequest {
  resultValues?: Record<string, any>;
  notes?: string;
}

export interface ResultDisplayValue {
  fieldName: string;
  fieldType: TestFieldType;
  value: any;
  formattedValue: string;
  isAbnormal?: boolean;
}

/**
 * Audiometry-specific result values structure
 * Field naming: {ear}_{frequency}
 * Example: right_125, left_1000, etc.
 */
export interface AudiometryResultValues {
  right_125?: number;
  right_250?: number;
  right_500?: number;
  right_750?: number;
  right_1000?: number;
  right_1500?: number;
  right_2000?: number;
  right_3000?: number;
  right_4000?: number;
  right_6000?: number;
  right_8000?: number;
  left_125?: number;
  left_250?: number;
  left_500?: number;
  left_750?: number;
  left_1000?: number;
  left_1500?: number;
  left_2000?: number;
  left_3000?: number;
  left_4000?: number;
  left_6000?: number;
  left_8000?: number;
}

