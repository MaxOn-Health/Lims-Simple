'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ReviewStatus } from '@/types/doctor-review.types';

interface ReviewStatusBadgeProps {
  status: ReviewStatus;
  className?: string;
}

const getReviewStatusVariant = (status: ReviewStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case ReviewStatus.PENDING:
      return 'secondary';
    case ReviewStatus.REVIEWED:
      return 'default';
    case ReviewStatus.SIGNED:
      return 'default';
    default:
      return 'outline';
  }
};

const getReviewStatusLabel = (status: ReviewStatus): string => {
  switch (status) {
    case ReviewStatus.PENDING:
      return 'Pending Review';
    case ReviewStatus.REVIEWED:
      return 'Reviewed';
    case ReviewStatus.SIGNED:
      return 'Signed';
    default:
      return status;
  }
};

export const ReviewStatusBadge: React.FC<ReviewStatusBadgeProps> = ({
  status,
  className,
}) => {
  return (
    <Badge variant={getReviewStatusVariant(status)} className={className}>
      {getReviewStatusLabel(status)}
    </Badge>
  );
};

