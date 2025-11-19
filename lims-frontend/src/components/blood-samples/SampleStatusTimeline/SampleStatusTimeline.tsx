'use client';

import React from 'react';
import { BloodSampleStatus } from '@/types/blood-sample.types';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface SampleStatusTimelineProps {
  currentStatus: BloodSampleStatus;
  collectedAt?: Date;
  testedAt?: Date;
}

export const SampleStatusTimeline: React.FC<SampleStatusTimelineProps> = ({
  currentStatus,
  collectedAt,
  testedAt,
}) => {
  const statuses: Array<{
    status: BloodSampleStatus;
    label: string;
    date?: Date;
  }> = [
    {
      status: BloodSampleStatus.COLLECTED,
      label: 'Collected',
      date: collectedAt,
    },
    {
      status: BloodSampleStatus.IN_LAB,
      label: 'In Lab',
    },
    {
      status: BloodSampleStatus.TESTED,
      label: 'Tested',
      date: testedAt,
    },
    {
      status: BloodSampleStatus.COMPLETED,
      label: 'Completed',
    },
  ];

  const getStatusIndex = (status: BloodSampleStatus): number => {
    return statuses.findIndex((s) => s.status === status);
  };

  const currentIndex = getStatusIndex(currentStatus);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Status Timeline</h3>
      <div className="relative">
        {statuses.map((statusItem, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={statusItem.status} className="flex items-start gap-4 pb-6 last:pb-0">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'rounded-full p-2',
                    isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </div>
                {index < statuses.length - 1 && (
                  <div
                    className={cn(
                      'w-0.5 h-full min-h-[2rem]',
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between">
                  <p
                    className={cn(
                      'font-medium',
                      isCurrent ? 'text-foreground' : isCompleted ? 'text-muted-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {statusItem.label}
                  </p>
                  {statusItem.date && (
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(statusItem.date), 'MMM dd, yyyy')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

