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
import { ResultStatus } from '@/types/result.types';
import { Patient } from '@/types/patient.types';
import { Test } from '@/types/test.types';

interface ResultFiltersProps {
  statusFilter?: ResultStatus;
  onStatusFilterChange: (status: ResultStatus | undefined) => void;
  patientFilter?: string;
  onPatientFilterChange: (patientId: string | undefined) => void;
  testFilter?: string;
  onTestFilterChange: (testId: string | undefined) => void;
  verifiedFilter?: boolean;
  onVerifiedFilterChange: (verified: boolean | undefined) => void;
  patients?: Patient[];
  tests?: Test[];
  onReset: () => void;
}

export const ResultFilters: React.FC<ResultFiltersProps> = ({
  statusFilter,
  onStatusFilterChange,
  patientFilter,
  onPatientFilterChange,
  testFilter,
  onTestFilterChange,
  verifiedFilter,
  onVerifiedFilterChange,
  patients = [],
  tests = [],
  onReset,
}) => {
  const statusOptions = [
    { value: 'NORMAL' as ResultStatus, label: 'Normal' },
    { value: 'ABNORMAL' as ResultStatus, label: 'Abnormal' },
  ];

  const verifiedOptions = [
    { value: true, label: 'Verified' },
    { value: false, label: 'Unverified' },
  ];

  const hasFilters =
    statusFilter !== undefined ||
    patientFilter !== undefined ||
    testFilter !== undefined ||
    verifiedFilter !== undefined;

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-2 min-w-[180px]">
        <Label htmlFor="status-filter" className="text-sm font-medium">
          Status
        </Label>
        <Select
          value={statusFilter || 'all'}
          onValueChange={(value) =>
            onStatusFilterChange(value === 'all' ? undefined : (value as ResultStatus))
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

      <div className="space-y-2 min-w-[180px]">
        <Label htmlFor="verified-filter" className="text-sm font-medium">
          Verified
        </Label>
        <Select
          value={verifiedFilter === undefined ? 'all' : verifiedFilter.toString()}
          onValueChange={(value) =>
            onVerifiedFilterChange(value === 'all' ? undefined : value === 'true')
          }
        >
          <SelectTrigger id="verified-filter" className="w-full">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {verifiedOptions.map((option) => (
              <SelectItem key={option.value.toString()} value={option.value.toString()}>
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

