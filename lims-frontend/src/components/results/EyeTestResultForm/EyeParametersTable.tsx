'use client';

import React from 'react';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import {
  getEyeParameterFieldName,
  EyeParameterType,
  EYE_LABELS,
  EYE_PARAMETER_LABELS,
} from '@/utils/constants/eye.constants';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EyeParametersTableProps {
  control: Control<any>;
  errors?: FieldErrors<any>;
  values?: Record<string, any>;
}

export const EyeParametersTable: React.FC<EyeParametersTableProps> = ({
  control,
  errors,
  values,
}) => {
  const headerBgColor = 'bg-blue-600';
  const headerTextColor = 'text-white';
  const cellBgColor = 'bg-gray-50';

  const parameters: Array<EyeParameterType> = ['sph', 'cyl', 'axis', 'add', 'vision'];
  const eyes: Array<'right' | 'left'> = ['right', 'left'];

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
              ></th>
              <th
                className={cn(
                  'px-2 py-1.5 text-center font-semibold text-xs border border-gray-300',
                  headerBgColor,
                  headerTextColor
                )}
              >
                {EYE_LABELS.RIGHT}
              </th>
              <th
                className={cn(
                  'px-2 py-1.5 text-center font-semibold text-xs border border-gray-300',
                  headerBgColor,
                  headerTextColor
                )}
              >
                {EYE_LABELS.LEFT}
              </th>
            </tr>
          </thead>
          <tbody>
            {parameters.map((parameter) => {
              const parameterLabel = EYE_PARAMETER_LABELS[parameter.toUpperCase() as keyof typeof EYE_PARAMETER_LABELS];

              return (
                <tr key={parameter} className={cn('border border-gray-300', cellBgColor)}>
                  <td
                    className={cn(
                      'px-2 py-1 font-medium text-xs border border-gray-300',
                      cellBgColor
                    )}
                  >
                    {parameterLabel}
                  </td>
                  {eyes.map((eye) => {
                    const fieldName = getEyeParameterFieldName(parameter, eye);
                    const fieldError = errors?.resultValues?.[fieldName];
                    const currentValue = values?.[fieldName];
                    const eyeLabel =
                      eye === 'right' ? EYE_LABELS.RIGHT : EYE_LABELS.LEFT;

                    return (
                      <td
                        key={eye}
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
                              aria-label={`${parameterLabel} ${eyeLabel}`}
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

