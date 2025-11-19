'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface TestStatusIndicatorProps {
  isNormal: boolean;
  className?: string;
  showIcon?: boolean;
}

export const TestStatusIndicator: React.FC<TestStatusIndicatorProps> = ({
  isNormal,
  className,
  showIcon = true,
}) => {
  const variant = isNormal ? 'default' : 'destructive';
  const label = isNormal ? 'Normal' : 'Abnormal';
  const Icon = isNormal ? CheckCircle2 : AlertCircle;

  return (
    <Badge variant={variant} className={`flex items-center gap-1 ${className || ''}`}>
      {showIcon && <Icon className="h-3 w-3" />}
      {label}
    </Badge>
  );
};

