'use client';

import React from 'react';
import { SearchInput } from '@/components/common/SearchInput/SearchInput';
import { Label } from '@/components/ui/label';

interface PatientSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const PatientSearch: React.FC<PatientSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search by name, patient ID, contact, or employee ID...',
}) => {
  return (
    <div className="w-full space-y-2">
      <Label htmlFor="patient-search" className="text-sm font-medium">
        Search
      </Label>
      <SearchInput
        id="patient-search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onClear={() => onChange('')}
      />
    </div>
  );
};

