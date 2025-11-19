'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ReportStatus } from '@/types/report.types';
import { Loader2 } from 'lucide-react';

interface ReportStatusBadgeProps {
  status: ReportStatus;
  className?: string;
}

export const ReportStatusBadge: React.FC<ReportStatusBadgeProps> = ({
  status,
  className,
}) => {
  let variant:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'success'
    | 'info'
    | null
    | undefined;
  let label: string;
  let icon: React.ReactNode = null;

  switch (status) {
    case ReportStatus.PENDING:
      variant = 'info';
      label = 'Pending';
      break;
    case ReportStatus.GENERATING:
      variant = 'secondary';
      label = 'Generating';
      icon = <Loader2 className="h-3 w-3 mr-1 animate-spin" />;
      break;
    case ReportStatus.COMPLETED:
      variant = 'success';
      label = 'Completed';
      break;
    case ReportStatus.FAILED:
      variant = 'destructive';
      label = 'Failed';
      break;
    default:
      variant = 'outline';
      label = 'Unknown';
  }

  return (
    <Badge variant={variant} className={className}>
      {icon}
      {label}
    </Badge>
  );
};



