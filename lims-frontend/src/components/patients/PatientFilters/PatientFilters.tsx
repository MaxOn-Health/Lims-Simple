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
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { PaymentStatus } from '@/types/patient.types';
import { Package } from '@/types/package.types';

interface PatientFiltersProps {
  paymentStatusFilter?: PaymentStatus;
  onPaymentStatusFilterChange: (status: PaymentStatus | undefined) => void;
  dateFromFilter?: string;
  onDateFromFilterChange: (date: string | undefined) => void;
  dateToFilter?: string;
  onDateToFilterChange: (date: string | undefined) => void;
  packageFilter?: string;
  onPackageFilterChange: (packageId: string | undefined) => void;
  packages?: Package[];
  onReset: () => void;
}

export const PatientFilters: React.FC<PatientFiltersProps> = ({
  paymentStatusFilter,
  onPaymentStatusFilterChange,
  dateFromFilter,
  onDateFromFilterChange,
  dateToFilter,
  onDateToFilterChange,
  packageFilter,
  onPackageFilterChange,
  packages = [],
  onReset,
}) => {
  const paymentStatusOptions = [
    { value: PaymentStatus.PENDING, label: 'Pending' },
    { value: PaymentStatus.PAID, label: 'Paid' },
    { value: PaymentStatus.PARTIAL, label: 'Partial' },
  ];

  const hasFilters =
    paymentStatusFilter !== undefined ||
    dateFromFilter !== undefined ||
    dateToFilter !== undefined ||
    packageFilter !== undefined;

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-2 min-w-[180px]">
        <Label htmlFor="payment-status-filter" className="text-sm font-medium">
          Payment Status
        </Label>
        <Select
          value={paymentStatusFilter || 'all'}
          onValueChange={(value) =>
            onPaymentStatusFilterChange(value === 'all' ? undefined : (value as PaymentStatus))
          }
        >
          <SelectTrigger id="payment-status-filter" className="w-full">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {paymentStatusOptions.map((option) => (
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
          className="w-full"
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
          className="w-full"
        />
      </div>

      {packages.length > 0 && (
        <div className="space-y-2 min-w-[180px]">
          <Label htmlFor="package-filter" className="text-sm font-medium">
            Package
          </Label>
          <Select
            value={packageFilter || 'all'}
            onValueChange={(value) => onPackageFilterChange(value === 'all' ? undefined : value)}
          >
            <SelectTrigger id="package-filter" className="w-full">
              <SelectValue placeholder="All packages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All packages</SelectItem>
              {packages.map((pkg) => (
                <SelectItem key={pkg.id} value={pkg.id}>
                  {pkg.name}
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

