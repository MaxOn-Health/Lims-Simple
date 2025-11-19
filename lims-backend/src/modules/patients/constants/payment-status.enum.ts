export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
}

export const PAYMENT_STATUS_ARRAY = Object.values(PaymentStatus);

export function isValidPaymentStatus(status: string): boolean {
  return PAYMENT_STATUS_ARRAY.includes(status as PaymentStatus);
}

