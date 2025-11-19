'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import {
  createPackageSchema,
  updatePackageSchema,
  CreatePackageFormData,
  UpdatePackageFormData,
} from '@/utils/validation/package-schemas';
import { Package } from '@/types/package.types';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import { packagesService } from '@/services/api/packages.service';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';

interface PackageFormProps {
  package?: Package;
  mode?: 'create' | 'edit';
  onSuccess?: () => void;
}

export const PackageForm: React.FC<PackageFormProps> = ({
  package: pkg,
  mode = 'create',
  onSuccess,
}) => {
  const router = useRouter();
  const { addToast } = useUIStore();
  const isEditMode = mode === 'edit' && !!pkg;

  const schema = isEditMode ? updatePackageSchema : createPackageSchema;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreatePackageFormData | UpdatePackageFormData>({
    resolver: zodResolver(schema),
    defaultValues: isEditMode
      ? {
          name: pkg.name,
          description: pkg.description || undefined,
          price: pkg.price,
          validityDays: pkg.validityDays,
        }
      : {
          validityDays: 365,
        },
  });

  const onSubmit = async (data: CreatePackageFormData | UpdatePackageFormData) => {
    try {
      if (isEditMode) {
        await packagesService.updatePackage(pkg!.id, data as UpdatePackageFormData);
        addToast({
          type: 'success',
          message: 'Package updated successfully',
        });
      } else {
        await packagesService.createPackage(data as CreatePackageFormData);
        addToast({
          type: 'success',
          message: 'Package created successfully',
        });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/packages');
      }
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Input
          id="name"
          label="Package Name"
          placeholder="Enter package name"
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
          rows={4}
          placeholder="Enter package description (optional)"
          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          {...register('description')}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div>
        <Input
          id="price"
          type="number"
          step="0.01"
          label="Price"
          placeholder="Enter price"
          required
          error={errors.price?.message}
          {...register('price', { valueAsNumber: true })}
        />
        <p className="mt-1 text-xs text-gray-500">
          Price must be a positive number with at most 2 decimal places
        </p>
      </div>

      <div>
        <Input
          id="validityDays"
          type="number"
          label="Validity Days"
          placeholder="Enter validity days"
          required
          error={errors.validityDays?.message}
          {...register('validityDays', { valueAsNumber: true })}
        />
        <p className="mt-1 text-xs text-gray-500">
          Number of days the package is valid (default: 365)
        </p>
      </div>

      {isEditMode && (
        <div className="flex items-center">
          <Controller
            name="isActive"
            control={control}
            defaultValue={pkg.isActive}
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
          {isEditMode ? 'Update Package' : 'Create Package'}
        </Button>
      </div>
    </form>
  );
};

