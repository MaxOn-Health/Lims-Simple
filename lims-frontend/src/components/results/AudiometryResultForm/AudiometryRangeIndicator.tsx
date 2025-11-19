'use client';

import React from 'react';
import { getHearingLossClassification } from '@/utils/constants/audiometry.constants';
import { cn } from '@/lib/utils';

interface AudiometryRangeIndicatorProps {
  value: number | null | undefined;
  className?: string;
}

export const AudiometryRangeIndicator: React.FC<AudiometryRangeIndicatorProps> = ({
  value,
  className,
}) => {
  if (value === null || value === undefined || isNaN(value)) {
    return null;
  }

  const classification = getHearingLossClassification(value);

  const colorClasses = {
    green: 'bg-green-100 border-green-300 text-green-800',
    yellow: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    orange: 'bg-orange-100 border-orange-300 text-orange-800',
    red: 'bg-red-100 border-red-300 text-red-800',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded border text-[10px] font-medium',
        colorClasses[classification.color as keyof typeof colorClasses],
        className
      )}
      title={classification.label}
    >
      <span className="sr-only">{classification.label}</span>
    </div>
  );
};

