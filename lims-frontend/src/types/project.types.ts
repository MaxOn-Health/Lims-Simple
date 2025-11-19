export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  SCHEDULED = 'SCHEDULED',
}

export interface CampSettings {
  autoGeneratePatientIds?: boolean;
  patientIdPrefix?: string;
  requireEmployeeId?: boolean;
  defaultPackageId?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  companyName?: string | null;
  contactPerson?: string | null;
  contactNumber?: string | null;
  contactEmail?: string | null;
  campDate?: string | null;
  campLocation?: string | null;
  campSettings?: CampSettings | null;
  patientCount: number;
  totalRevenue: number;
  status: ProjectStatus;
  notes?: string | null;
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
  campDate?: string;
  campLocation?: string;
  campSettings?: CampSettings;
  notes?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  companyName?: string;
  contactPerson?: string;
  contactNumber?: string;
  contactEmail?: string;
  campDate?: string;
  campLocation?: string;
  campSettings?: CampSettings;
  notes?: string;
}

export interface QueryProjectsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProjectStatus;
  companyName?: string;
  campDateFrom?: string;
  campDateTo?: string;
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

