'use client';

import React from 'react';
import { SearchInput } from '@/components/common/SearchInput/SearchInput';
import { Label } from '@/components/ui/label';

interface ResultSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const ResultSearch: React.FC<ResultSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search by patient name, patient ID, or test name...',
}) => {
  return (
    <div className="w-full space-y-2">
      <Label htmlFor="result-search" className="text-sm font-medium">
        Search
      </Label>
      <SearchInput
        id="result-search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onClear={() => onChange('')}
      />
    </div>
  );
};

