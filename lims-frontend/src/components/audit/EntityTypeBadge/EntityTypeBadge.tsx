'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { formatEntityType } from '@/utils/audit-helpers';

interface EntityTypeBadgeProps {
  entityType: string;
  className?: string;
}

export const EntityTypeBadge: React.FC<EntityTypeBadgeProps> = ({
  entityType,
  className,
}) => {
  return (
    <Badge variant="outline" className={className}>
      {formatEntityType(entityType)}
    </Badge>
  );
};



