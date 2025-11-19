'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/common/Button/Button';
import { ReportStatus } from '@/types/report.types';
import { X } from 'lucide-react';

interface ReportFiltersProps {
  status?: ReportStatus;
  dateFrom?: string;
  dateTo?: string;
  patientId?: string;
  onStatusChange: (status: ReportStatus | undefined) => void;
  onDateFromChange: (date: string | undefined) => void;
  onDateToChange: (date: string | undefined) => void;
  onPatientIdChange: (patientId: string | undefined) => void;
  onClear: () => void;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  status,
  dateFrom,
  dateTo,
  patientId,
  onStatusChange,
  onDateFromChange,
  onDateToChange,
  onPatientIdChange,
  onClear,
}) => {
  const hasFilters = status || dateFrom || dateTo || patientId;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="status-filter">Status</Label>
          <Select value={status || 'all'} onValueChange={(value) => onStatusChange(value === 'all' ? undefined : (value as ReportStatus))}>
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={ReportStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={ReportStatus.GENERATING}>Generating</SelectItem>
              <SelectItem value={ReportStatus.COMPLETED}>Completed</SelectItem>
              <SelectItem value={ReportStatus.FAILED}>Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="date-from">From Date</Label>
          <Input
            id="date-from"
            type="date"
            value={dateFrom || ''}
            onChange={(e) => onDateFromChange(e.target.value || undefined)}
          />
        </div>

        <div>
          <Label htmlFor="date-to">To Date</Label>
          <Input
            id="date-to"
            type="date"
            value={dateTo || ''}
            onChange={(e) => onDateToChange(e.target.value || undefined)}
          />
        </div>

        <div>
          <Label htmlFor="patient-id">Patient ID</Label>
          <Input
            id="patient-id"
            type="text"
            placeholder="Enter patient ID"
            value={patientId || ''}
            onChange={(e) => onPatientIdChange(e.target.value || undefined)}
          />
        </div>
      </div>

      {hasFilters && (
        <div>
          <Button variant="outline" size="sm" onClick={onClear} className="gap-2">
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

