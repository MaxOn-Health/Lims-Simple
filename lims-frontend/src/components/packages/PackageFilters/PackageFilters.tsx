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
import { X } from 'lucide-react';

interface PackageFiltersProps {
  isActiveFilter?: boolean;
  onIsActiveFilterChange: (isActive: boolean | undefined) => void;
  onReset: () => void;
}

export const PackageFilters: React.FC<PackageFiltersProps> = ({
  isActiveFilter,
  onIsActiveFilterChange,
  onReset,
}) => {
  const statusOptions = [
    { value: true, label: 'Active' },
    { value: false, label: 'Inactive' },
  ];

  const hasFilters = isActiveFilter !== undefined;

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-2 min-w-[180px]">
        <Label htmlFor="status-filter" className="text-sm font-medium">
          Status
        </Label>
        <Select
          value={
            isActiveFilter === undefined
              ? 'all'
              : isActiveFilter === true
              ? 'true'
              : 'false'
          }
          onValueChange={(value) =>
            onIsActiveFilterChange(
              value === 'all' ? undefined : value === 'true'
            )
          }
        >
          <SelectTrigger id="status-filter" className="w-full">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={String(option.value)} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

