'use client';

import React from 'react';
import { getRangeStatus } from '@/utils/result-helpers';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NormalRangeIndicatorProps {
  value: number;
  min: number | null;
  max: number | null;
  unit?: string | null;
  className?: string;
}

export const NormalRangeIndicator: React.FC<NormalRangeIndicatorProps> = ({
  value,
  min,
  max,
  unit,
  className,
}) => {
  if (min === null && max === null) {
    return null; // No normal range defined
  }

  const status = getRangeStatus(value, min, max);
  const rangeText = min !== null && max !== null 
    ? `${min} - ${max}${unit ? ` ${unit}` : ''}`
    : min !== null 
    ? `≥ ${min}${unit ? ` ${unit}` : ''}`
    : `≤ ${max}${unit ? ` ${unit}` : ''}`;

  const statusConfig = {
    normal: {
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950',
      borderColor: 'border-green-200 dark:border-green-800',
      label: 'Within normal range',
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      label: 'Near limits',
    },
    abnormal: {
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950',
      borderColor: 'border-red-200 dark:border-red-800',
      label: 'Outside normal range',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border p-2',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', config.color)} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-foreground">
          Normal Range: {rangeText}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          Current: {value}{unit ? ` ${unit}` : ''} • {config.label}
        </div>
      </div>
    </div>
  );
};

