'use client';

import React from 'react';

interface FilterDropdownOption<T = string> {
  value: T;
  label: string;
}

interface FilterDropdownProps<T = string> {
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  options: FilterDropdownOption<T>[];
  placeholder?: string;
  label?: string;
  className?: string;
  allowClear?: boolean;
}

export function FilterDropdown<T = string>({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  label,
  className = '',
  allowClear = true,
}: FilterDropdownProps<T>) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <select
        value={value === undefined ? '' : String(value)}
        onChange={(e) => {
          const selectedValue = e.target.value;
          if (selectedValue === '' && allowClear) {
            onChange(undefined);
          } else {
            const option = options.find(
              (opt) => String(opt.value) === selectedValue
            );
            if (option) {
              onChange(option.value);
            }
          }
        }}
        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

