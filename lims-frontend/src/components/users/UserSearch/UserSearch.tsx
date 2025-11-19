'use client';

import React from 'react';
import { SearchInput } from '@/components/common/SearchInput/SearchInput';
import { Label } from '@/components/ui/label';

interface UserSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const UserSearch: React.FC<UserSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search by name or email...',
}) => {
  return (
    <div className="w-full space-y-2">
      <Label htmlFor="user-search" className="text-sm font-medium">
        Search
      </Label>
      <SearchInput
        id="user-search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onClear={() => onChange('')}
      />
    </div>
  );
};


