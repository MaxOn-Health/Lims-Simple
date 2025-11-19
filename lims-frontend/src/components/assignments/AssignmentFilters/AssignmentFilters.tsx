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
import { AssignmentStatus } from '@/types/assignment.types';
import { Patient } from '@/types/patient.types';
import { Test } from '@/types/test.types';
import { User } from '@/types/user.types';

interface AssignmentFiltersProps {
  statusFilter?: AssignmentStatus;
  onStatusFilterChange: (status: AssignmentStatus | undefined) => void;
  patientFilter?: string;
  onPatientFilterChange: (patientId: string | undefined) => void;
  testFilter?: string;
  onTestFilterChange: (testId: string | undefined) => void;
  adminFilter?: string;
  onAdminFilterChange: (adminId: string | undefined) => void;
  patients?: Patient[];
  tests?: Test[];
  admins?: User[];
  onReset: () => void;
}

export const AssignmentFilters: React.FC<AssignmentFiltersProps> = ({
  statusFilter,
  onStatusFilterChange,
  patientFilter,
  onPatientFilterChange,
  testFilter,
  onTestFilterChange,
  adminFilter,
  onAdminFilterChange,
  patients = [],
  tests = [],
  admins = [],
  onReset,
}) => {
  const statusOptions = [
    { value: AssignmentStatus.PENDING, label: 'Pending' },
    { value: AssignmentStatus.ASSIGNED, label: 'Assigned' },
    { value: AssignmentStatus.IN_PROGRESS, label: 'In Progress' },
    { value: AssignmentStatus.COMPLETED, label: 'Completed' },
    { value: AssignmentStatus.SUBMITTED, label: 'Submitted' },
  ];

  const hasFilters =
    statusFilter !== undefined ||
    patientFilter !== undefined ||
    testFilter !== undefined ||
    adminFilter !== undefined;

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-2 min-w-[180px]">
        <Label htmlFor="status-filter" className="text-sm font-medium">
          Status
        </Label>
        <Select
          value={statusFilter || 'all'}
          onValueChange={(value) =>
            onStatusFilterChange(value === 'all' ? undefined : (value as AssignmentStatus))
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

      {patients.length > 0 && (
        <div className="space-y-2 min-w-[180px]">
          <Label htmlFor="patient-filter" className="text-sm font-medium">
            Patient
          </Label>
          <Select
            value={patientFilter || 'all'}
            onValueChange={(value) => onPatientFilterChange(value === 'all' ? undefined : value)}
          >
            <SelectTrigger id="patient-filter" className="w-full">
              <SelectValue placeholder="All patients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All patients</SelectItem>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.name} ({patient.patientId})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {tests.length > 0 && (
        <div className="space-y-2 min-w-[180px]">
          <Label htmlFor="test-filter" className="text-sm font-medium">
            Test
          </Label>
          <Select
            value={testFilter || 'all'}
            onValueChange={(value) => onTestFilterChange(value === 'all' ? undefined : value)}
          >
            <SelectTrigger id="test-filter" className="w-full">
              <SelectValue placeholder="All tests" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tests</SelectItem>
              {tests.map((test) => (
                <SelectItem key={test.id} value={test.id}>
                  {test.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {admins.length > 0 && (
        <div className="space-y-2 min-w-[180px]">
          <Label htmlFor="admin-filter" className="text-sm font-medium">
            Admin
          </Label>
          <Select
            value={adminFilter || 'all'}
            onValueChange={(value) => onAdminFilterChange(value === 'all' ? undefined : value)}
          >
            <SelectTrigger id="admin-filter" className="w-full">
              <SelectValue placeholder="All admins" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All admins</SelectItem>
              {admins.map((admin) => (
                <SelectItem key={admin.id} value={admin.id}>
                  {admin.fullName || admin.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onReset} className="h-10">
          <X className="mr-2 h-4 w-4" />
          Reset Filters
        </Button>
      )}
    </div>
  );
};

