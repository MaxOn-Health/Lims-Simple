'use client';

import React from 'react';
import { UserRole } from '@/types/user.types';
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

interface UserFiltersProps {
  roleFilter?: UserRole;
  onRoleFilterChange: (role: UserRole | undefined) => void;
  activeFilter?: boolean;
  onActiveFilterChange: (active: boolean | undefined) => void;
  onReset: () => void;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  roleFilter,
  onRoleFilterChange,
  activeFilter,
  onActiveFilterChange,
  onReset,
}) => {
  const roleOptions = [
    { value: UserRole.SUPER_ADMIN, label: 'Super Admin' },
    { value: UserRole.RECEPTIONIST, label: 'Receptionist' },
    { value: UserRole.TEST_TECHNICIAN, label: 'Test Technician' },
    { value: UserRole.LAB_TECHNICIAN, label: 'Lab Technician' },
    { value: UserRole.DOCTOR, label: 'Doctor' },
  ];

  const activeOptions = [
    { value: true, label: 'Active' },
    { value: false, label: 'Inactive' },
  ];

  const hasFilters = roleFilter !== undefined || activeFilter !== undefined;

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-2 min-w-[180px]">
        <Label htmlFor="role-filter" className="text-sm font-medium">
          Role
        </Label>
        <Select
          value={roleFilter || 'all'}
          onValueChange={(value) =>
            onRoleFilterChange(value === 'all' ? undefined : (value as UserRole))
          }
        >
          <SelectTrigger id="role-filter" className="w-full">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {roleOptions.map((option) => (
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
            activeFilter === undefined
              ? 'all'
              : activeFilter === true
              ? 'true'
              : 'false'
          }
          onValueChange={(value) =>
            onActiveFilterChange(
              value === 'all' ? undefined : value === 'true'
            )
          }
        >
          <SelectTrigger id="status-filter" className="w-full">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {activeOptions.map((option) => (
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

