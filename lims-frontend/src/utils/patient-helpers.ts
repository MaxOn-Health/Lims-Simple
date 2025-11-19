import { PaymentStatus } from '@/types/patient.types';

export function formatPatientId(patientId: string): string {
  return patientId;
}

export function getPaymentStatusColor(status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.PAID:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case PaymentStatus.PARTIAL:
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    case PaymentStatus.PENDING:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
}

export function getPaymentStatusVariant(status: PaymentStatus): 'default' | 'secondary' | 'outline' {
  switch (status) {
    case PaymentStatus.PAID:
      return 'default';
    case PaymentStatus.PARTIAL:
      return 'outline';
    case PaymentStatus.PENDING:
      return 'secondary';
    default:
      return 'secondary';
  }
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.PAID:
      return 'Paid';
    case PaymentStatus.PARTIAL:
      return 'Partial';
    case PaymentStatus.PENDING:
      return 'Pending';
    default:
      return status;
  }
}

export function calculateRemainingAmount(total: number, paid: number): number {
  return Math.max(0, total - paid);
}

export function formatContactNumber(contact: string): string {
  return contact;
}

