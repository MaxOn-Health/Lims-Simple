'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';

interface VerifiedBadgeProps {
  isVerified: boolean;
  className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  isVerified,
  className,
}) => {
  if (isVerified) {
    return (
      <Badge variant="default" className={`gap-1 ${className || ''}`}>
        <CheckCircle2 className="h-3 w-3" />
        Verified
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={`gap-1 ${className || ''}`}>
      <XCircle className="h-3 w-3" />
      Unverified
    </Badge>
  );
};

