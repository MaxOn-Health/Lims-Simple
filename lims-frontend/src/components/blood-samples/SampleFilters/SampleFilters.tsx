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
import { BloodSampleStatus } from '@/types/blood-sample.types';
import { Patient } from '@/types/patient.types';

interface SampleFiltersProps {
  statusFilter?: BloodSampleStatus;
  onStatusFilterChange: (status: BloodSampleStatus | undefined) => void;
  dateFromFilter?: string;
  onDateFromFilterChange: (date: string | undefined) => void;
  dateToFilter?: string;
  onDateToFilterChange: (date: string | undefined) => void;
  patientFilter?: string;
  onPatientFilterChange: (patientId: string | undefined) => void;
  patients?: Patient[];
  onReset: () => void;
}

export const SampleFilters: React.FC<SampleFiltersProps> = ({
  statusFilter,
  onStatusFilterChange,
  dateFromFilter,
  onDateFromFilterChange,
  dateToFilter,
  onDateToFilterChange,
  patientFilter,
  onPatientFilterChange,
  patients = [],
  onReset,
}) => {
  const statusOptions = [
    { value: BloodSampleStatus.COLLECTED, label: 'Collected' },
    { value: BloodSampleStatus.IN_LAB, label: 'In Lab' },
    { value: BloodSampleStatus.TESTED, label: 'Tested' },
    { value: BloodSampleStatus.COMPLETED, label: 'Completed' },
  ];

  const hasFilters =
    statusFilter !== undefined ||
    dateFromFilter !== undefined ||
    dateToFilter !== undefined ||
    patientFilter !== undefined;

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-2 min-w-[180px]">
        <Label htmlFor="status-filter" className="text-sm font-medium">
          Status
        </Label>
        <Select
          value={statusFilter || 'all'}
          onValueChange={(value) =>
            onStatusFilterChange(value === 'all' ? undefined : (value as BloodSampleStatus))
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
        <Label htmlFor="date-from-filter" className="text-sm font-medium">
          Date From
        </Label>
        <Input
          id="date-from-filter"
          type="date"
          value={dateFromFilter || ''}
          onChange={(e) => onDateFromFilterChange(e.target.value || undefined)}
        />
      </div>

      <div className="space-y-2 min-w-[180px]">
        <Label htmlFor="date-to-filter" className="text-sm font-medium">
          Date To
        </Label>
        <Input
          id="date-to-filter"
          type="date"
          value={dateToFilter || ''}
          onChange={(e) => onDateToFilterChange(e.target.value || undefined)}
        />
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

      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onReset} className="h-10">
          <X className="mr-2 h-4 w-4" />
          Reset Filters
        </Button>
      )}
    </div>
  );
};

