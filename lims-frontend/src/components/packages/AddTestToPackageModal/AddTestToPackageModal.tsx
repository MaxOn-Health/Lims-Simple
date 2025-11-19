'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { packagesService } from '@/services/api/packages.service';
import { Test } from '@/types/test.types';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage, transformError } from '@/utils/error-handler';

interface AddTestToPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  packageId: string;
  availableTests: Test[];
  preselectedTestId?: string | null;
}

interface FormData {
  testId: string;
  testPrice?: number;
}

export const AddTestToPackageModal: React.FC<AddTestToPackageModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  packageId,
  availableTests,
  preselectedTestId,
}) => {
  const { addToast } = useUIStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      testId: preselectedTestId || '',
      testPrice: undefined,
    },
  });

  useEffect(() => {
    if (preselectedTestId) {
      setValue('testId', preselectedTestId);
    }
  }, [preselectedTestId, setValue]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await packagesService.addTestToPackage(packageId, {
        testId: data.testId,
        testPrice: data.testPrice,
      });
      addToast({
        type: 'success',
        message: 'Test added to package successfully',
      });
      reset();
      onSuccess();
    } catch (err) {
      const apiError = transformError(err);
      addToast({
        type: 'error',
        message: getErrorMessage(apiError),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Test to Package" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="testId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Select Test <span className="text-red-500">*</span>
          </label>
          <Controller
            name="testId"
            control={control}
            rules={{ required: 'Please select a test' }}
            render={({ field }) => (
              <select
                {...field}
                id="testId"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="">Select a test</option>
                {availableTests.map((test) => (
                  <option key={test.id} value={test.id}>
                    {test.name} ({test.category})
                  </option>
                ))}
              </select>
            )}
          />
          {errors.testId && (
            <p className="mt-1 text-sm text-red-600">{errors.testId.message}</p>
          )}
        </div>

        <div>
          <Input
            id="testPrice"
            type="number"
            step="0.01"
            label="Price Override (Optional)"
            placeholder="Enter override price"
            error={errors.testPrice?.message}
            {...register('testPrice', {
              valueAsNumber: true,
              validate: (value) => {
                if (value !== undefined && value < 0) {
                  return 'Price must be a positive number';
                }
                return true;
              },
            })}
          />
          <p className="mt-1 text-xs text-gray-500">
            Leave empty to use default test price
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Add Test
          </Button>
        </div>
      </form>
    </Modal>
  );
};

