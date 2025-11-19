'use client';

import React from 'react';
import { SearchInput } from '@/components/common/SearchInput/SearchInput';
import { Label } from '@/components/ui/label';

interface ProjectSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const ProjectSearch: React.FC<ProjectSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search by name, company, or description...',
}) => {
  return (
    <div className="w-full space-y-2">
      <Label htmlFor="project-search" className="text-sm font-medium">
        Search
      </Label>
      <SearchInput
        id="project-search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onClear={() => onChange('')}
      />
    </div>
  );
};

