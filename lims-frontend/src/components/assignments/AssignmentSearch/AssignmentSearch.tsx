'use client';

import React from 'react';
import { SearchInput } from '@/components/common/SearchInput/SearchInput';
import { Label } from '@/components/ui/label';

interface AssignmentSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const AssignmentSearch: React.FC<AssignmentSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search by patient name, patient ID, or test name...',
}) => {
  return (
    <div className="w-full space-y-2">
      <Label htmlFor="assignment-search" className="text-sm font-medium">
        Search
      </Label>
      <SearchInput
        id="assignment-search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onClear={() => onChange('')}
      />
    </div>
  );
};

