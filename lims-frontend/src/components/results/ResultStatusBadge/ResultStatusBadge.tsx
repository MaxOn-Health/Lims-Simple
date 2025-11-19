'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ResultStatus } from '@/types/result.types';

interface ResultStatusBadgeProps {
  status: ResultStatus;
  className?: string;
}

export const ResultStatusBadge: React.FC<ResultStatusBadgeProps> = ({
  status,
  className,
}) => {
  const variant = status === 'NORMAL' ? 'default' : 'destructive';
  const label = status === 'NORMAL' ? 'Normal' : 'Abnormal';

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
};

