'use client';

import React from 'react';
import { SearchInput } from '@/components/common/SearchInput/SearchInput';
import { Label } from '@/components/ui/label';

interface PackageSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const PackageSearch: React.FC<PackageSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search by name...',
}) => {
  return (
    <div className="w-full space-y-2">
      <Label htmlFor="package-search" className="text-sm font-medium">
        Search
      </Label>
      <SearchInput
        id="package-search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onClear={() => onChange('')}
      />
    </div>
  );
};

