'use client';

import React from 'react';
import { Control, Controller, FieldErrors, useFormContext } from 'react-hook-form';
import { VisionTable } from './VisionTable';
import { EyeParametersTable } from './EyeParametersTable';
import {
  getEyeHealthFieldName,
  EYE_HEALTH_LABELS,
  NORMAL_EYE_HEALTH_VALUES,
} from '@/utils/constants/eye.constants';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/common/Button/Button';
import { cn } from '@/lib/utils';

interface EyeTestResultFormProps {
  control: Control<any>;
  errors?: FieldErrors<any>;
  values?: Record<string, any>;
}

export const EyeTestResultForm: React.FC<EyeTestResultFormProps> = ({
  control,
  errors,
  values,
}) => {
  const { setValue } = useFormContext();

  const handleNormalEyeHealth = () => {
    Object.keys(NORMAL_EYE_HEALTH_VALUES).forEach((key) => {
      const fieldName = getEyeHealthFieldName(
        key as keyof typeof EYE_HEALTH_LABELS
      );
      setValue(`resultValues.${fieldName}`, NORMAL_EYE_HEALTH_VALUES[key as keyof typeof NORMAL_EYE_HEALTH_VALUES]);
    });
  };

  const handleNormalVision = () => {
    setValue('resultValues.normal_vision', 'Yes'); // Changed from true to 'Yes' for string validation
    setValue('resultValues.near_normal_vision', ''); // Changed from false to ''
  };

  const handleNearNormalVision = () => {
    setValue('resultValues.normal_vision', ''); // Changed from false to ''
    setValue('resultValues.near_normal_vision', 'Yes'); // Changed from true to 'Yes'
  };

  const eyeHealthFields: Array<keyof typeof EYE_HEALTH_LABELS> = [
    'EYE_LIDS',
    'CONJUNCTIVA',
    'CORNEA',
    'PUPIL',
    'COLOUR_BLINDNESS',
  ];

  return (
    <div className="space-y-4">
      {/* Distance Vision Table */}
      <div className="space-y-2">
        <VisionTable
          visionType="distance"
          control={control}
          errors={errors}
          values={values}
        />
      </div>

      {/* Near Vision Table */}
      <div className="space-y-2">
        <VisionTable
          visionType="near"
          control={control}
          errors={errors}
          values={values}
        />
      </div>

      {/* Eye Parameters Table */}
      <div className="space-y-2">
        <EyeParametersTable
          control={control}
          errors={errors}
          values={values}
        />
      </div>

      {/* Eye Health Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="text-sm font-semibold text-gray-700 mb-2">Eye Health</div>
          {eyeHealthFields.map((fieldKey) => {
            const fieldName = getEyeHealthFieldName(fieldKey);
            const fieldLabel = EYE_HEALTH_LABELS[fieldKey];
            const fieldError = errors?.resultValues?.[fieldName];

            return (
              <div key={fieldKey} className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor={fieldName}
                    className="text-xs font-medium min-w-[120px]"
                  >
                    {fieldLabel}:
                  </Label>
                  <Controller
                    name={`resultValues.${fieldName}`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        id={fieldName}
                        type="text"
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === '' ? undefined : val);
                        }}
                        onBlur={field.onBlur}
                        className={cn(
                          'flex-1 h-7 text-xs py-0 px-1.5',
                          fieldError &&
                          'border-destructive focus-visible:ring-destructive'
                        )}
                        aria-label={fieldLabel}
                      />
                    )}
                  />
                </div>
                {fieldError && (
                  <p className="text-xs text-destructive ml-[124px]">
                    {fieldError.message as string}
                  </p>
                )}
              </div>
            );
          })}
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleNormalEyeHealth}
              className="h-8 text-xs"
            >
              Normal
            </Button>
          </div>
        </div>

        {/* Vision Status Buttons */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-gray-700 mb-2">Vision Status</div>
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleNormalVision}
              className={cn(
                'w-full h-8 text-xs',
                values?.normal_vision && 'bg-blue-100 border-blue-500 text-blue-900'
              )}
            >
              Normal VISION
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleNearNormalVision}
              className={cn(
                'w-full h-8 text-xs',
                values?.near_normal_vision && 'bg-blue-100 border-blue-500 text-blue-900'
              )}
            >
              Near normal VISION
            </Button>
          </div>
        </div>
      </div>

      {/* Instructions/Info */}
      <div className="mt-2 p-2 bg-muted rounded text-xs text-muted-foreground">
        <strong>Instructions:</strong> Fill in all vision test results, eye parameters, and health
        observations. Use the Normal button to quickly fill standard eye health values.
      </div>
    </div>
  );
};

