import { BloodSampleStatus } from '@/types/blood-sample.types';

/**
 * Get badge color for a blood sample status
 */
export function getStatusColor(status: BloodSampleStatus): string {
  switch (status) {
    case BloodSampleStatus.COLLECTED:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case BloodSampleStatus.IN_LAB:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case BloodSampleStatus.TESTED:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case BloodSampleStatus.COMPLETED:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
}

/**
 * Get display label for a blood sample status
 */
export function getStatusLabel(status: BloodSampleStatus): string {
  switch (status) {
    case BloodSampleStatus.COLLECTED:
      return 'Collected';
    case BloodSampleStatus.IN_LAB:
      return 'In Lab';
    case BloodSampleStatus.TESTED:
      return 'Tested';
    case BloodSampleStatus.COMPLETED:
      return 'Completed';
    default:
      return status;
  }
}

/**
 * Get valid status transitions from current status
 */
export function getValidStatusTransitions(currentStatus: BloodSampleStatus): BloodSampleStatus[] {
  const validTransitions: Record<BloodSampleStatus, BloodSampleStatus[]> = {
    [BloodSampleStatus.COLLECTED]: [BloodSampleStatus.IN_LAB],
    [BloodSampleStatus.IN_LAB]: [BloodSampleStatus.TESTED, BloodSampleStatus.COLLECTED],
    [BloodSampleStatus.TESTED]: [BloodSampleStatus.COMPLETED],
    [BloodSampleStatus.COMPLETED]: [],
  };

  return validTransitions[currentStatus] || [];
}

/**
 * Check if a status transition is valid
 */
export function canUpdateStatus(
  currentStatus: BloodSampleStatus,
  newStatus: BloodSampleStatus
): boolean {
  const validTransitions = getValidStatusTransitions(currentStatus);
  return validTransitions.includes(newStatus);
}

/**
 * Format sample ID for display
 */
export function formatSampleId(sampleId: string): string {
  // Sample ID is already in format BL-YYYYMMDD-XXXX
  return sampleId;
}

/**
 * Format passcode for display (masked)
 */
export function formatPasscode(passcode: string, show: boolean = false): string {
  if (show) {
    return passcode;
  }
  return '••••••';
}

/**
 * Get status icon name (for use with lucide-react icons)
 */
export function getStatusIcon(status: BloodSampleStatus): string {
  switch (status) {
    case BloodSampleStatus.COLLECTED:
      return 'Droplet';
    case BloodSampleStatus.IN_LAB:
      return 'FlaskConical';
    case BloodSampleStatus.TESTED:
      return 'CheckCircle';
    case BloodSampleStatus.COMPLETED:
      return 'CheckCircle2';
    default:
      return 'Circle';
  }
}

/**
 * Check if sample can be accessed (status is COLLECTED or IN_LAB)
 */
export function canAccessSample(status: BloodSampleStatus): boolean {
  return status === BloodSampleStatus.COLLECTED || status === BloodSampleStatus.IN_LAB;
}

/**
 * Check if result can be submitted (status is IN_LAB or TESTED)
 */
export function canSubmitResult(status: BloodSampleStatus): boolean {
  return status === BloodSampleStatus.IN_LAB || status === BloodSampleStatus.TESTED;
}

