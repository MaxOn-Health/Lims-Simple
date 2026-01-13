export enum AssignmentStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SUBMITTED = 'SUBMITTED',
}

export interface PatientInfo {
  id: string;
  patientId: string;
  name: string;
  projectId?: string;
  employeeId: string | null;
  companyName: string | null;
}

export interface TestInfo {
  id: string;
  name: string;
  category: string;
  adminRole: string;
}

export interface AdminInfo {
  id: string;
  email: string;
  fullName: string;
  testTechnicianType: string | null;
}

export interface Assignment {
  id: string;
  patientId: string;
  testId: string;
  adminId: string | null;
  status: AssignmentStatus;
  assignedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  assignedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  patient?: PatientInfo;
  test?: TestInfo;
  admin?: AdminInfo | null;
}

export interface AvailableTechnician {
  id: string;
  fullName: string;
  email: string;
  testTechnicianType: string | null;
  currentAssignmentCount?: number;
  isAvailable?: boolean;
}

export interface CreateAssignmentRequest {
  patientId: string;
  testId: string;
  adminId?: string;
}

export interface ReassignAssignmentRequest {
  adminId: string;
}

export interface UpdateAssignmentStatusRequest {
  status: AssignmentStatus;
}

export interface QueryAssignmentsParams {
  status?: AssignmentStatus;
  patientId?: string;
  adminId?: string;
  testId?: string;
  projectId?: string;
}

export type AutoAssignResponse = Assignment[];


export interface AutoAssignPreviewItem {
  testId: string;
  testName: string;
  adminId: string | null;
  adminName: string | null;
  adminEmail: string | null;
  adminRole: string;
  isAvailable: boolean;
}

export interface AutoAssignRequest {
  overrides?: Record<string, string>;
}
