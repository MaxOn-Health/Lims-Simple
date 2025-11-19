'use client';

import React from 'react';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import { AUDIOMETRY_FREQUENCIES, EAR_LABELS, getAudiometryFieldName, EarType, AUDIOMETRY_DB_MIN, AUDIOMETRY_DB_MAX } from '@/utils/constants/audiometry.constants';
import { Input } from '@/components/ui/input';
import { AudiometryRangeIndicator } from './AudiometryRangeIndicator';
import { cn } from '@/lib/utils';

interface AudiometryTableProps {
  ear: EarType;
  control: Control<any>;
  errors?: FieldErrors<any>;
  values?: Record<string, any>;
}

export const AudiometryTable: React.FC<AudiometryTableProps> = ({
  ear,
  control,
  errors,
  values,
}) => {
  const earLabel = ear === 'right' ? EAR_LABELS.RIGHT : EAR_LABELS.LEFT;
  const isRight = ear === 'right';

  // Color scheme: red for right, blue for left
  const headerBgColor = isRight ? 'bg-red-600' : 'bg-blue-600';
  const headerTextColor = 'text-white';
  const cellBgColor = isRight ? 'bg-red-50' : 'bg-blue-50';
  const borderColor = isRight ? 'border-red-200' : 'border-blue-200';

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th
                className={cn(
                  'px-2 py-1.5 text-left font-semibold text-xs border border-gray-300',
                  headerBgColor,
                  headerTextColor
                )}
              >
                HZ
              </th>
              <th
                className={cn(
                  'px-2 py-1.5 text-left font-semibold text-xs border border-gray-300',
                  headerBgColor,
                  headerTextColor
                )}
              >
                SOUND (DB)
              </th>
            </tr>
            <tr>
              <th
                colSpan={2}
                className={cn(
                  'px-2 py-1 text-center font-bold text-sm border border-gray-300',
                  headerBgColor,
                  headerTextColor
                )}
              >
                {earLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {AUDIOMETRY_FREQUENCIES.map((frequency) => {
              const fieldName = getAudiometryFieldName(ear, frequency);
              const fieldError = errors?.resultValues?.[fieldName];
              const currentValue = values?.[fieldName];

              return (
                <tr key={frequency} className={cn('border border-gray-300', cellBgColor)}>
                  <td
                    className={cn(
                      'px-2 py-1 font-medium text-xs border border-gray-300',
                      cellBgColor
                    )}
                  >
                    {frequency}
                  </td>
                  <td className={cn('px-2 py-1 border border-gray-300', cellBgColor)}>
                    <div className="flex items-center gap-1.5">
                      <Controller
                        name={`resultValues.${fieldName}`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            type="number"
                            min={AUDIOMETRY_DB_MIN}
                            max={AUDIOMETRY_DB_MAX}
                            step="1"
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(val === '' ? undefined : parseFloat(val));
                            }}
                            onBlur={field.onBlur}
                            className={cn(
                              'w-16 h-7 text-xs py-0 px-1.5',
                              fieldError && 'border-destructive focus-visible:ring-destructive'
                            )}
                            aria-label={`${earLabel} ear ${frequency} Hz sound level in decibels`}
                          />
                        )}
                      />
                      {currentValue !== null && currentValue !== undefined && !isNaN(Number(currentValue)) && (
                        <AudiometryRangeIndicator value={Number(currentValue)} />
                      )}
                    </div>
                    {fieldError && (
                      <p className="text-xs text-destructive mt-0.5">
                        {fieldError.message as string}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

