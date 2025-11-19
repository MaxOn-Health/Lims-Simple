'use client';

import React from 'react';
import { SearchInput } from '@/components/common/SearchInput/SearchInput';
import { Label } from '@/components/ui/label';

interface TestSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const TestSearch: React.FC<TestSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search by name...',
}) => {
  return (
    <div className="w-full space-y-2">
      <Label htmlFor="test-search" className="text-sm font-medium">
        Search
      </Label>
      <SearchInput
        id="test-search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onClear={() => onChange('')}
      />
    </div>
  );
};

