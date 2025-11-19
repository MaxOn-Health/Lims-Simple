'use client';

import React from 'react';
import { Control, Controller, FieldError } from 'react-hook-form';
import { TestField, TestFieldType } from '@/types/test.types';
import { Input } from '@/components/common/Input/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NormalRangeIndicator } from '../NormalRangeIndicator/NormalRangeIndicator';
import { getFieldLabel } from '@/utils/result-helpers';
import { Test } from '@/types/test.types';

interface ResultFieldRendererProps {
  field: TestField;
  control: Control<any>;
  error?: FieldError;
  test?: Test;
  value?: any;
}

export const ResultFieldRenderer: React.FC<ResultFieldRendererProps> = ({
  field,
  control,
  error,
  test,
  value,
}) => {
  const fieldLabel = getFieldLabel(field.field_name);
  const fieldId = `field-${field.field_name}`;
  const isNumberField = field.field_type === TestFieldType.NUMBER;
  const showRangeIndicator =
    isNumberField &&
    test &&
    (test.normalRangeMin !== null || test.normalRangeMax !== null) &&
    value !== undefined &&
    value !== null &&
    !isNaN(Number(value));

  return (
    <div className="space-y-2">
      <Controller
        name={`resultValues.${field.field_name}`}
        control={control}
        render={({ field: formField }) => {
          switch (field.field_type) {
            case TestFieldType.NUMBER:
              return (
                <>
                  <Input
                    id={fieldId}
                    label={fieldLabel}
                    type="number"
                    step="any"
                    required={field.required}
                    value={formField.value ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      formField.onChange(val === '' ? undefined : parseFloat(val));
                    }}
                    onBlur={formField.onBlur}
                    error={error?.message}
                  />
                  {showRangeIndicator && (
                    <NormalRangeIndicator
                      value={Number(formField.value)}
                      min={test!.normalRangeMin}
                      max={test!.normalRangeMax}
                      unit={test!.unit}
                    />
                  )}
                </>
              );

            case TestFieldType.TEXT:
              return (
                <div className="space-y-2">
                  <Label htmlFor={fieldId}>
                    {fieldLabel}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <Textarea
                    id={fieldId}
                    value={formField.value ?? ''}
                    onChange={(e) => formField.onChange(e.target.value)}
                    onBlur={formField.onBlur}
                    required={field.required}
                    className={error ? 'border-destructive' : ''}
                  />
                  {error && (
                    <p className="text-sm font-medium text-destructive">{error.message}</p>
                  )}
                </div>
              );

            case TestFieldType.SELECT:
              if (!field.options || field.options.length === 0) {
                return (
                  <div className="space-y-2">
                    <Label htmlFor={fieldId}>
                      {fieldLabel}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      No options available for this field
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-2">
                  <Label htmlFor={fieldId}>
                    {fieldLabel}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <Select
                    value={formField.value ?? ''}
                    onValueChange={formField.onChange}
                    required={field.required}
                  >
                    <SelectTrigger id={fieldId} className={error ? 'border-destructive' : ''}>
                      <SelectValue placeholder={`Select ${fieldLabel.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {error && (
                    <p className="text-sm font-medium text-destructive">{error.message}</p>
                  )}
                </div>
              );

            case TestFieldType.BOOLEAN:
              return (
                <div className="flex items-center space-x-2">
                  <Controller
                    name={`resultValues.${field.field_name}`}
                    control={control}
                    render={({ field: checkboxField }) => (
                      <Checkbox
                        id={fieldId}
                        checked={checkboxField.value ?? false}
                        onCheckedChange={checkboxField.onChange}
                        required={field.required}
                      />
                    )}
                  />
                  <Label
                    htmlFor={fieldId}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {fieldLabel}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {error && (
                    <p className="text-sm font-medium text-destructive ml-2">{error.message}</p>
                  )}
                </div>
              );

            case TestFieldType.DATE:
              return (
                <Input
                  id={fieldId}
                  label={fieldLabel}
                  type="date"
                  required={field.required}
                  value={
                    formField.value
                      ? typeof formField.value === 'string'
                        ? formField.value.split('T')[0]
                        : new Date(formField.value).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) => {
                    const dateValue = e.target.value;
                    formField.onChange(dateValue ? new Date(dateValue).toISOString() : undefined);
                  }}
                  onBlur={formField.onBlur}
                  error={error?.message}
                />
              );

            case TestFieldType.FILE:
              return (
                <Input
                  id={fieldId}
                  label={fieldLabel}
                  type="file"
                  required={field.required}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // For now, store file name. In production, upload file and store URL/ID
                      formField.onChange(file.name);
                    }
                  }}
                  onBlur={formField.onBlur}
                  error={error?.message}
                />
              );

            default:
              return (
                <Input
                  id={fieldId}
                  label={fieldLabel}
                  required={field.required}
                  value={formField.value ?? ''}
                  onChange={(e) => formField.onChange(e.target.value)}
                  onBlur={formField.onBlur}
                  error={error?.message}
                />
              );
          }
        }}
      />
    </div>
  );
};

