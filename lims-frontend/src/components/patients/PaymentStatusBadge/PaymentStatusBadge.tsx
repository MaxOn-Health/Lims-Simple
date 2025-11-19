'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { PaymentStatus } from '@/types/patient.types';
import { getPaymentStatusVariant, getPaymentStatusLabel } from '@/utils/patient-helpers';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status,
  className,
}) => {
  return (
    <Badge variant={getPaymentStatusVariant(status)} className={className}>
      {getPaymentStatusLabel(status)}
    </Badge>
  );
};

