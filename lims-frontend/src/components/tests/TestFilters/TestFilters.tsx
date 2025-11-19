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
import { TestCategory } from '@/types/test.types';
import { TEST_ADMIN_TYPES } from '@/types/user.types';

interface TestFiltersProps {
  categoryFilter?: TestCategory;
  onCategoryFilterChange: (category: TestCategory | undefined) => void;
  adminRoleFilter?: string;
  onAdminRoleFilterChange: (adminRole: string | undefined) => void;
  isActiveFilter?: boolean;
  onIsActiveFilterChange: (isActive: boolean | undefined) => void;
  onReset: () => void;
}

export const TestFilters: React.FC<TestFiltersProps> = ({
  categoryFilter,
  onCategoryFilterChange,
  adminRoleFilter,
  onAdminRoleFilterChange,
  isActiveFilter,
  onIsActiveFilterChange,
  onReset,
}) => {
  const categoryOptions = [
    { value: TestCategory.ON_SITE, label: 'On Site' },
    { value: TestCategory.LAB, label: 'Lab' },
  ];

  const adminRoleOptions = TEST_ADMIN_TYPES.map((role) => ({
    value: role,
    label: role.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  const statusOptions = [
    { value: true, label: 'Active' },
    { value: false, label: 'Inactive' },
  ];

  const hasFilters =
    categoryFilter !== undefined ||
    adminRoleFilter !== undefined ||
    isActiveFilter !== undefined;

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-2 min-w-[180px]">
        <Label htmlFor="category-filter" className="text-sm font-medium">
          Category
        </Label>
        <Select
          value={categoryFilter || 'all'}
          onValueChange={(value) =>
            onCategoryFilterChange(value === 'all' ? undefined : (value as TestCategory))
          }
        >
          <SelectTrigger id="category-filter" className="w-full">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 min-w-[180px]">
        <Label htmlFor="admin-role-filter" className="text-sm font-medium">
          Admin Role
        </Label>
        <Select
          value={adminRoleFilter || 'all'}
          onValueChange={(value) =>
            onAdminRoleFilterChange(value === 'all' ? undefined : value)
          }
        >
          <SelectTrigger id="admin-role-filter" className="w-full">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {adminRoleOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
