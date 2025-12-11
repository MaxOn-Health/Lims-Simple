import { UserRole } from './user.types';

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  SCHEDULED = 'SCHEDULED',
}

export enum RoleInProject {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export interface CampSettings {
  autoGeneratePatientIds?: boolean;
  patientIdPrefix?: string;
  requireEmployeeId?: boolean;
  defaultPackageId?: string;
}

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  roleInProject: RoleInProject;
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    testTechnicianType?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  companyName?: string | null;
  contactPerson?: string | null;
  contactNumber?: string | null;
  contactEmail?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  campLocation?: string | null;
  campSettings?: CampSettings | null;
  patientCount: number;
  totalRevenue: number;
  status: ProjectStatus;
  notes?: string | null;
  members?: ProjectMember[];
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  companyName?: string;
  contactPerson?: string;
  contactNumber?: string;
  contactEmail?: string;
  startDate?: string;
  endDate?: string;
  campLocation?: string;
  campSettings?: CampSettings;
  notes?: string;
  memberIds?: string[];
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  companyName?: string;
  contactPerson?: string;
  contactNumber?: string;
  contactEmail?: string;
  startDate?: string;
  endDate?: string;
  campLocation?: string;
  campSettings?: CampSettings;
  notes?: string;
}

export interface AddMemberRequest {
  userId: string;
  roleInProject?: RoleInProject;
}

export interface QueryProjectsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProjectStatus;
  companyName?: string;
  startDateFrom?: string;
  startDateTo?: string;
}

export interface PaginatedProjectsResponse {
  data: Project[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
