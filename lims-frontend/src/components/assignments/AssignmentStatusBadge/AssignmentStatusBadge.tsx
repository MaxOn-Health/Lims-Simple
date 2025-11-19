'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AssignmentStatus } from '@/types/assignment.types';
import {
  getAssignmentStatusVariant,
  getAssignmentStatusLabel,
} from '@/utils/assignment-helpers';

interface AssignmentStatusBadgeProps {
  status: AssignmentStatus;
  className?: string;
}

export const AssignmentStatusBadge: React.FC<AssignmentStatusBadgeProps> = ({
  status,
  className,
}) => {
  return (
    <Badge variant={getAssignmentStatusVariant(status)} className={className}>
      {getAssignmentStatusLabel(status)}
    </Badge>
  );
};

