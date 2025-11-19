'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { formatAuditAction, getActionColor } from '@/utils/audit-helpers';
import { cn } from '@/lib/utils';

interface ActionBadgeProps {
  action: string;
  className?: string;
}

export const ActionBadge: React.FC<ActionBadgeProps> = ({ action, className }) => {
  const color = getActionColor(action);
  
  // Map to available badge variants
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
  let customClasses = '';

  if (color === 'success') {
    variant = 'default';
    customClasses = 'bg-green-500 text-white hover:bg-green-600';
  } else if (color === 'info') {
    variant = 'secondary';
    customClasses = 'bg-blue-500 text-white hover:bg-blue-600';
  } else if (color === 'destructive') {
    variant = 'destructive';
  } else {
    variant = color === 'secondary' ? 'secondary' : 'default';
  }

  return (
    <Badge variant={variant} className={cn(customClasses, className)}>
      {formatAuditAction(action)}
    </Badge>
  );
};



