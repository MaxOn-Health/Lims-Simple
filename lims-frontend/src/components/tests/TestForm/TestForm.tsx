'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import {
  createTestSchema,
  updateTestSchema,
  CreateTestFormData,
  UpdateTestFormData,
} from '@/utils/validation/test-schemas';
import { Test, TestCategory, TEST_CATEGORIES } from '@/types/test.types';
import { TEST_ADMIN_TYPES } from '@/types/user.types';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import { testsService } from '@/services/api/tests.service';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { TestFieldsBuilder } from '../TestFieldsBuilder';

interface TestFormProps {
  test?: Test;
  mode?: 'create' | 'edit';
  onSuccess?: () => void;
}

export const TestForm: React.FC<TestFormProps> = ({
  test,
  mode = 'create',
  onSuccess,
}) => {
  const router = useRouter();
  const { addToast } = useUIStore();
  const isEditMode = mode === 'edit' && !!test;

  const schema = isEditMode ? updateTestSchema : createTestSchema;

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateTestFormData | UpdateTestFormData>({
    resolver: zodResolver(schema),
    defaultValues: isEditMode
      ? {
          name: test.name,
          description: test.description || undefined,
          category: test.category,
          adminRole: test.adminRole,
          normalRangeMin: test.normalRangeMin || undefined,
          normalRangeMax: test.normalRangeMax || undefined,
          unit: test.unit || undefined,
          testFields: test.testFields || [],
        }
      : {
          testFields: [],
        },
  });

  const onSubmit = async (data: CreateTestFormData | UpdateTestFormData) => {
    try {
      if (isEditMode) {
        await testsService.updateTest(test!.id, data as UpdateTestFormData);
        addToast({
          type: 'success',
          message: 'Test updated successfully',
        });
      } else {
        await testsService.createTest(data as CreateTestFormData);
        addToast({
          type: 'success',
          message: 'Test created successfully',
        });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/tests');
      }
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError),
      });
    }
  };

  const categoryOptions = TEST_CATEGORIES.map((cat) => ({
    value: cat,
    label: cat.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  const adminRoleOptions = TEST_ADMIN_TYPES.map((role) => ({
    value: role,
    label: role.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="border-b border-gray-200 pb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

        <div className="space-y-4">
          <div>
            <Input
              id="name"
              label="Test Name"
              placeholder="Enter test name"
              required
              error={errors.name?.message}
              {...register('name')}
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Enter test description (optional)"
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              {...register('description')}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category <span className="text-red-500">*</span>
              </label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    id="category"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="">Select category</option>
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="adminRole"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Admin Role <span className="text-red-500">*</span>
              </label>
              <Controller
                name="adminRole"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    id="adminRole"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="">Select admin role</option>
                    {adminRoleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.adminRole && (
                <p className="mt-1 text-sm text-red-600">{errors.adminRole.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 pb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Normal Range</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Input
              id="normalRangeMin"
              type="number"
              step="0.01"
              label="Min Value"
              placeholder="Enter minimum value"
              error={errors.normalRangeMin?.message}
              {...register('normalRangeMin', { valueAsNumber: true })}
            />
          </div>

          <div>
            <Input
              id="normalRangeMax"
              type="number"
              step="0.01"
              label="Max Value"
              placeholder="Enter maximum value"
              error={errors.normalRangeMax?.message}
              {...register('normalRangeMax', { valueAsNumber: true })}
            />
          </div>

          <div>
            <Input
              id="unit"
              label="Unit"
              placeholder="e.g., g/dL, mg/L"
              error={errors.unit?.message}
              {...register('unit')}
            />
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 pb-6">
        <TestFieldsBuilder control={control} watch={watch} errors={errors} />
      </div>

      {isEditMode && (
        <div className="flex items-center">
          <Controller
            name="isActive"
            control={control}
            defaultValue={test.isActive}
            render={({ field: { value, onChange } }) => (
              <input
                type="checkbox"
                id="isActive"
                checked={value ?? true}
                onChange={(e) => onChange(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            )}
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
            Active
          </label>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {isEditMode ? 'Update Test' : 'Create Test'}
        </Button>
      </div>
    </form>
  );
};

