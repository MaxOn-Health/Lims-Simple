'use client';

import React from 'react';
import { SearchInput } from '@/components/common/SearchInput/SearchInput';
import { Label } from '@/components/ui/label';

interface SampleSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SampleSearch: React.FC<SampleSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search by sample ID or patient name...',
}) => {
  return (
    <div className="w-full space-y-2">
      <Label htmlFor="sample-search" className="text-sm font-medium">
        Search
      </Label>
      <SearchInput
        id="sample-search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onClear={() => onChange('')}
      />
    </div>
  );
};

