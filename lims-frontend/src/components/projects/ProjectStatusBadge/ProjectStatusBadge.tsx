import React from 'react';
import { ProjectStatus } from '@/types/project.types';
import { cn } from '@/lib/utils';

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

export const ProjectStatusBadge: React.FC<ProjectStatusBadgeProps> = ({
  status,
  className,
}) => {
  const getStatusConfig = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.ACTIVE:
        return {
          label: 'Active',
          className: 'bg-green-100 text-green-800 border-green-200',
        };
      case ProjectStatus.COMPLETED:
        return {
          label: 'Completed',
          className: 'bg-blue-100 text-blue-800 border-blue-200',
        };
      case ProjectStatus.CANCELLED:
        return {
          label: 'Cancelled',
          className: 'bg-red-100 text-red-800 border-red-200',
        };
      case ProjectStatus.SCHEDULED:
        return {
          label: 'Scheduled',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        };
      default:
        return {
          label: status,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
};

