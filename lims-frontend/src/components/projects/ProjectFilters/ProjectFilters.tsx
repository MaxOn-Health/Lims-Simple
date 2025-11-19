'use client';

import React from 'react';
import { Button } from '@/components/common/Button/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/common/Input/Input';
import { X } from 'lucide-react';
import { ProjectStatus } from '@/types/project.types';

interface ProjectFiltersProps {
  statusFilter?: ProjectStatus;
  onStatusFilterChange: (status: ProjectStatus | undefined) => void;
  companyNameFilter?: string;
  onCompanyNameFilterChange: (companyName: string | undefined) => void;
  campDateFrom?: string;
  onCampDateFromChange: (date: string | undefined) => void;
  campDateTo?: string;
  onCampDateToChange: (date: string | undefined) => void;
  onReset: () => void;
}

export const ProjectFilters: React.FC<ProjectFiltersProps> = ({
  statusFilter,
  onStatusFilterChange,
  companyNameFilter,
  onCompanyNameFilterChange,
  campDateFrom,
  onCampDateFromChange,
  campDateTo,
  onCampDateToChange,
  onReset,
}) => {
  const statusOptions = [
    { value: ProjectStatus.ACTIVE, label: 'Active' },
    { value: ProjectStatus.COMPLETED, label: 'Completed' },
    { value: ProjectStatus.CANCELLED, label: 'Cancelled' },
    { value: ProjectStatus.SCHEDULED, label: 'Scheduled' },
  ];

  const hasFilters =
    statusFilter !== undefined ||
    companyNameFilter !== undefined ||
    campDateFrom !== undefined ||
    campDateTo !== undefined;

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-2 min-w-[180px]">
        <Label htmlFor="status-filter" className="text-sm font-medium">
          Status
        </Label>
        <Select
          value={statusFilter || 'all'}
          onValueChange={(value) =>
            onStatusFilterChange(value === 'all' ? undefined : (value as ProjectStatus))
          }
        >
          <SelectTrigger id="status-filter" className="w-full">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 min-w-[200px]">
        <Label htmlFor="company-filter" className="text-sm font-medium">
          Company Name
        </Label>
        <Input
          id="company-filter"
          type="text"
          placeholder="Filter by company..."
          value={companyNameFilter || ''}
          onChange={(e) => onCompanyNameFilterChange(e.target.value || undefined)}
        />
      </div>

      <div className="space-y-2 min-w-[180px]">
        <Label htmlFor="date-from-filter" className="text-sm font-medium">
          Camp Date From
        </Label>
        <Input
          id="date-from-filter"
          type="date"
          value={campDateFrom || ''}
          onChange={(e) => onCampDateFromChange(e.target.value || undefined)}
        />
      </div>

      <div className="space-y-2 min-w-[180px]">
        <Label htmlFor="date-to-filter" className="text-sm font-medium">
          Camp Date To
        </Label>
        <Input
          id="date-to-filter"
          type="date"
          value={campDateTo || ''}
          onChange={(e) => onCampDateToChange(e.target.value || undefined)}
        />
      </div>

      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onReset} className="h-10">
          <X className="mr-2 h-4 w-4" />
          Reset Filters
        </Button>
      )}
    </div>
  );
};

