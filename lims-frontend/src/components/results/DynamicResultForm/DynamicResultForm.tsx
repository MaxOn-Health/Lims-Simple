'use client';

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Test, TestField } from '@/types/test.types';
import { SubmitResultRequest, UpdateResultRequest } from '@/types/result.types';
import { ResultFieldRenderer } from '../ResultFieldRenderer/ResultFieldRenderer';
import {
  createSubmitResultSchema,
  createUpdateResultSchema,
} from '@/utils/validation/result-schemas';
import { createAudiometryResultValuesSchema } from '@/utils/validation/audiometry-schema';
import { AudiometryResultForm } from '../AudiometryResultForm/AudiometryResultForm';
import { createEyeTestResultValuesSchema } from '@/utils/validation/eye-schema';
import { EyeTestResultForm } from '../EyeTestResultForm/EyeTestResultForm';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/common/Button/Button';

interface DynamicResultFormProps {
  test: Test;
  defaultValues?: Record<string, any>;
  onSubmit: (data: SubmitResultRequest | UpdateResultRequest) => Promise<void>;
  onCancel?: () => void;
  mode?: 'create' | 'edit';
  isSubmitting?: boolean;
}

export const DynamicResultForm: React.FC<DynamicResultFormProps> = ({
  test,
  defaultValues,
  onSubmit,
  onCancel,
  mode = 'create',
  isSubmitting = false,
}) => {
  // Detect if this is an audiometry test
  const isAudiometryTest =
    test.adminRole === 'audiometry' ||
    test.name.toLowerCase().includes('audiometry');

  // Detect if this is an eye test
  const isEyeTest =
    test.adminRole === 'eye' ||
    test.name.toLowerCase().includes('eye');

  // Use specialized schema if it's a specialized test, otherwise use standard schema
  // Note: assignmentId is added by the parent component, so we don't validate it here
  const schema = isAudiometryTest
    ? (mode === 'edit'
        ? z.object({
            resultValues: createAudiometryResultValuesSchema().optional(),
            notes: z.string().optional(),
          })
        : z.object({
            resultValues: createAudiometryResultValuesSchema(),
            notes: z.string().optional(),
          }))
    : isEyeTest
    ? (mode === 'edit'
        ? z.object({
            resultValues: createEyeTestResultValuesSchema().optional(),
            notes: z.string().optional(),
          })
        : z.object({
            resultValues: createEyeTestResultValuesSchema(),
            notes: z.string().optional(),
          }))
    : (mode === 'edit'
        ? createUpdateResultSchema(
            test.testFields,
            test.normalRangeMin,
            test.normalRangeMax
          )
        : createSubmitResultSchema(
            test.testFields,
            test.normalRangeMin,
            test.normalRangeMax
          ));

  const form = useForm<SubmitResultRequest | UpdateResultRequest>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || {
      resultValues: {},
      notes: '',
    },
  });

  const {
    handleSubmit,
    register,
    control,
    formState: { errors },
    watch,
  } = form;

  const resultValues = watch('resultValues');

  const handleFormSubmit = async (data: SubmitResultRequest | UpdateResultRequest) => {
    await onSubmit(data);
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3">
        {/* Render specialized form if it's a specialized test, otherwise render standard fields */}
        {isAudiometryTest ? (
          <AudiometryResultForm
            control={control}
            errors={errors}
            values={resultValues}
          />
        ) : isEyeTest ? (
          <EyeTestResultForm
            control={control}
            errors={errors}
            values={resultValues}
          />
        ) : (
          <div className="space-y-4">
            {test.testFields.map((field: TestField) => {
              const fieldError = errors.resultValues?.[field.field_name as keyof typeof errors.resultValues];
              return (
                <ResultFieldRenderer
                  key={field.field_name}
                  field={field}
                  control={control}
                  error={fieldError as any}
                  test={test}
                  value={resultValues?.[field.field_name]}
                />
              );
            })}
          </div>
        )}

        {/* Notes field */}
        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-sm">Notes (Optional)</Label>
          <Textarea
            id="notes"
            {...register('notes')}
            placeholder="Add any additional notes about the test results..."
            rows={3}
            className="text-sm"
          />
          {errors.notes && (
            <p className="text-xs font-medium text-destructive">{errors.notes.message}</p>
          )}
        </div>

        {/* Form actions */}
        <div className="flex gap-2 pt-1">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} type="button" disabled={isSubmitting} className="h-8 text-sm">
              Cancel
            </Button>
          )}
          <Button type="submit" isLoading={isSubmitting} className="h-8 text-sm">
            {mode === 'edit' ? 'Update Result' : 'Submit Result'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};

