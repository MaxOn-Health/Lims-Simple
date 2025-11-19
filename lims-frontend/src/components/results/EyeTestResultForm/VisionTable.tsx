'use client';

import React from 'react';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import {
  getVisionFieldName,
  VisionType,
  EYE_LABELS,
  GLASS_TYPE_LABELS,
} from '@/utils/constants/eye.constants';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface VisionTableProps {
  visionType: VisionType;
  control: Control<any>;
  errors?: FieldErrors<any>;
  values?: Record<string, any>;
}

export const VisionTable: React.FC<VisionTableProps> = ({
  visionType,
  control,
  errors,
  values,
}) => {
  const visionLabel =
    visionType === 'distance' ? 'Distance vision' : 'Near vision';
  const headerBgColor = 'bg-blue-600';
  const headerTextColor = 'text-white';
  const cellBgColor = 'bg-gray-50';

  const eyes: Array<'right' | 'left'> = ['right', 'left'];
  const glassTypes: Array<'without_glass' | 'with_glass'> = [
    'without_glass',
    'with_glass',
  ];

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
                {visionLabel}
              </th>
              <th
                className={cn(
                  'px-2 py-1.5 text-left font-semibold text-xs border border-gray-300',
                  headerBgColor,
                  headerTextColor
                )}
              >
                {GLASS_TYPE_LABELS.WITHOUT_GLASS}
              </th>
              <th
                className={cn(
                  'px-2 py-1.5 text-left font-semibold text-xs border border-gray-300',
                  headerBgColor,
                  headerTextColor
                )}
              >
                {GLASS_TYPE_LABELS.WITH_GLASS}
              </th>
            </tr>
          </thead>
          <tbody>
            {eyes.map((eye) => {
              const eyeLabel =
                eye === 'right' ? EYE_LABELS.RIGHT : EYE_LABELS.LEFT;

              return (
                <tr key={eye} className={cn('border border-gray-300', cellBgColor)}>
                  <td
                    className={cn(
                      'px-2 py-1 font-medium text-xs border border-gray-300',
                      cellBgColor
                    )}
                  >
                    {eyeLabel}
                  </td>
                  {glassTypes.map((glassType) => {
                    const fieldName = getVisionFieldName(visionType, eye, glassType);
                    const fieldError = errors?.resultValues?.[fieldName];
                    const currentValue = values?.[fieldName];

                    return (
                      <td
                        key={glassType}
                        className={cn('px-2 py-1 border border-gray-300', cellBgColor)}
                      >
                        <Controller
                          name={`resultValues.${fieldName}`}
                          control={control}
                          render={({ field }) => (
                            <Input
                              type="text"
                              value={field.value ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(val === '' ? undefined : val);
                              }}
                              onBlur={field.onBlur}
                              className={cn(
                                'w-full h-7 text-xs py-0 px-1.5',
                                fieldError &&
                                  'border-destructive focus-visible:ring-destructive'
                              )}
                              aria-label={`${eyeLabel} ${visionLabel} ${glassType === 'without_glass' ? GLASS_TYPE_LABELS.WITHOUT_GLASS : GLASS_TYPE_LABELS.WITH_GLASS}`}
                            />
                          )}
                        />
                        {fieldError && (
                          <p className="text-xs text-destructive mt-0.5">
                            {fieldError.message as string}
                          </p>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

