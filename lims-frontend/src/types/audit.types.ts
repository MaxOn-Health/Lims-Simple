import { User } from './user.types';

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  changes: Record<string, any> | null;
  timestamp: Date;
  user?: User | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  SIGN = 'SIGN',
  VERIFY = 'VERIFY',
  ASSIGN = 'ASSIGN',
  SUBMIT = 'SUBMIT',
}

export enum EntityType {
  USER = 'USER',
  PATIENT = 'PATIENT',
  PACKAGE = 'PACKAGE',
  TEST = 'TEST',
  ASSIGNMENT = 'ASSIGNMENT',
  RESULT = 'RESULT',
  BLOOD_SAMPLE = 'BLOOD_SAMPLE',
  DOCTOR_REVIEW = 'DOCTOR_REVIEW',
  REPORT = 'REPORT',
}

export interface PaginatedAuditLogsResponse {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryAuditLogsParams {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface AuditLogChanges {
  before?: Record<string, any>;
  after?: Record<string, any>;
  added?: Record<string, any>;
  removed?: Record<string, any>;
  modified?: Record<string, { before: any; after: any }>;
}



