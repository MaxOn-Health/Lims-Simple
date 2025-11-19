import { AuditLog, AuditAction, EntityType, AuditLogChanges } from '@/types/audit.types';
import { format } from 'date-fns';

/**
 * Format audit action for display
 */
export function formatAuditAction(action: string): string {
  const actionMap: Record<string, string> = {
    CREATE: 'Created',
    UPDATE: 'Updated',
    DELETE: 'Deleted',
    VIEW: 'Viewed',
    LOGIN: 'Logged In',
    LOGOUT: 'Logged Out',
    SIGN: 'Signed',
    VERIFY: 'Verified',
    ASSIGN: 'Assigned',
    SUBMIT: 'Submitted',
  };

  return actionMap[action.toUpperCase()] || action;
}

/**
 * Format entity type for display
 */
export function formatEntityType(entityType: string): string {
  const typeMap: Record<string, string> = {
    USER: 'User',
    PATIENT: 'Patient',
    PACKAGE: 'Package',
    TEST: 'Test',
    ASSIGNMENT: 'Assignment',
    RESULT: 'Result',
    BLOOD_SAMPLE: 'Blood Sample',
    DOCTOR_REVIEW: 'Doctor Review',
    REPORT: 'Report',
  };

  return typeMap[entityType] || entityType;
}

/**
 * Get color variant for action badge
 */
export function getActionColor(action: string): 'default' | 'secondary' | 'destructive' | 'success' | 'info' {
  const upperAction = action.toUpperCase();
  
  if (upperAction === AuditAction.CREATE) {
    return 'success';
  }
  if (upperAction === AuditAction.UPDATE) {
    return 'info';
  }
  if (upperAction === AuditAction.DELETE) {
    return 'destructive';
  }
  if (upperAction === AuditAction.VIEW || upperAction === AuditAction.LOGIN) {
    return 'secondary';
  }
  
  return 'default';
}

/**
 * Format changes for display
 */
export function formatChanges(changes: Record<string, any> | null): AuditLogChanges | null {
  if (!changes) {
    return null;
  }

  // If changes already have before/after structure
  if (changes.before && changes.after) {
    return {
      before: changes.before,
      after: changes.after,
      modified: getModifiedFields(changes.before, changes.after),
    };
  }

  // If changes have added/removed/modified structure
  if (changes.added || changes.removed || changes.modified) {
    return {
      added: changes.added,
      removed: changes.removed,
      modified: changes.modified,
    };
  }

  // Otherwise, treat entire object as after (for CREATE actions)
  return {
    after: changes,
  };
}

/**
 * Get modified fields from before/after objects
 */
function getModifiedFields(
  before: Record<string, any>,
  after: Record<string, any>
): Record<string, { before: any; after: any }> {
  const modified: Record<string, { before: any; after: any }> = {};
  
  const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  
  allKeys.forEach((key) => {
    const beforeValue = before?.[key];
    const afterValue = after?.[key];
    
    if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
      modified[key] = {
        before: beforeValue,
        after: afterValue,
      };
    }
  });
  
  return modified;
}

/**
 * Format timestamp for display
 */
export function formatAuditTimestamp(timestamp: Date | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return format(date, 'MMM dd, yyyy HH:mm:ss');
}

/**
 * Get entity detail URL based on entity type
 */
export function getEntityDetailUrl(entityType: string, entityId: string | null): string | null {
  if (!entityId) {
    return null;
  }

  const urlMap: Record<string, string> = {
    USER: `/users/${entityId}`,
    PATIENT: `/patients/${entityId}`,
    PACKAGE: `/packages/${entityId}`,
    TEST: `/tests/${entityId}`,
    ASSIGNMENT: `/assignments/${entityId}`,
    RESULT: `/results/${entityId}`,
    BLOOD_SAMPLE: `/blood-samples/${entityId}`,
    DOCTOR_REVIEW: `/doctor/patients/${entityId}/review`,
    REPORT: `/reports/${entityId}`,
  };

  return urlMap[entityType] || null;
}

/**
 * Export audit logs to CSV
 */
export function exportAuditLogsToCSV(logs: AuditLog[]): void {
  const headers = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Changes'];
  const rows = logs.map((log) => [
    formatAuditTimestamp(log.timestamp),
    log.user?.fullName || log.user?.email || 'System',
    formatAuditAction(log.action),
    formatEntityType(log.entityType),
    log.entityId || 'N/A',
    log.changes ? JSON.stringify(log.changes) : 'N/A',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Check if changes object is empty
 */
export function isEmptyChanges(changes: Record<string, any> | null): boolean {
  if (!changes) {
    return true;
  }
  return Object.keys(changes).length === 0;
}

/**
 * Format value for display in change view
 */
export function formatValueForDisplay(value: any): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}



