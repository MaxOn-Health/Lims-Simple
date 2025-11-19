'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { BloodSampleStatus } from '@/types/blood-sample.types';
import { getStatusColor, getStatusLabel } from '@/utils/blood-sample-helpers';

interface SampleStatusBadgeProps {
  status: BloodSampleStatus;
  className?: string;
}

export const SampleStatusBadge: React.FC<SampleStatusBadgeProps> = ({
  status,
  className,
}) => {
  const colorClass = getStatusColor(status);
  const label = getStatusLabel(status);

  return (
    <Badge className={`${colorClass} ${className || ''}`}>
      {label}
    </Badge>
  );
};

