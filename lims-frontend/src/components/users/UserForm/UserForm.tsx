'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import {
  createUserSchema,
  updateUserSchema,
  CreateUserFormData,
  UpdateUserFormData,
} from '@/utils/validation/user-schemas';
import { User, UserRole, TEST_ADMIN_TYPES } from '@/types/user.types';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import { usersService } from '@/services/api/users.service';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { useAuthStore } from '@/store/auth.store';
import { isSuperAdmin } from '@/utils/rbac/role-helpers';

interface UserFormProps {
  user?: User;
  mode?: 'create' | 'edit';
  onSuccess?: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({
  user,
  mode = 'create',
  onSuccess,
}) => {
  const router = useRouter();
  const { addToast } = useUIStore();
  const { user: currentUser } = useAuthStore();
  const isEditMode = mode === 'edit' && !!user;
  const canManageRoles = isSuperAdmin(currentUser);

  const schema = isEditMode ? updateUserSchema : createUserSchema;

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormData | UpdateUserFormData>({
    resolver: zodResolver(schema),
    defaultValues: isEditMode
      ? {
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          testTechnicianType: user.testTechnicianType || undefined,
          isActive: user.isActive,
        }
      : {
          isActive: true,
        },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: CreateUserFormData | UpdateUserFormData) => {
    try {
      if (isEditMode) {
        await usersService.updateUser(user!.id, data as UpdateUserFormData);
        addToast({
          type: 'success',
          message: 'User updated successfully',
        });
      } else {
        // Exclude isActive from create request as backend sets it to true by default
        const { isActive, ...createData } = data as CreateUserFormData;
        await usersService.createUser(createData);
        addToast({
          type: 'success',
          message: 'User created successfully',
        });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/users');
      }
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError),
      });
    }
  };

  const testAdminTypeOptions = TEST_ADMIN_TYPES.map((type) => ({
    value: type,
    label: type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  const roleOptions = Object.values(UserRole).map((role) => ({
    value: role,
    label: role
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' '),
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Input
          id="fullName"
          label="Full Name"
          placeholder="Enter full name"
          required
          error={errors.fullName?.message}
          {...register('fullName')}
        />
      </div>

      <div>
        <Input
          id="email"
          type="email"
          label="Email"
          placeholder="Enter email address"
          required
          error={errors.email?.message}
          {...register('email')}
        />
      </div>

      {!isEditMode && (
        <div>
          <Input
            id="password"
            type="password"
            label="Password"
            placeholder="Enter password"
            required
            error={errors.password?.message}
            {...register('password')}
          />
          <p className="mt-1 text-xs text-gray-500">
            Password must be at least 8 characters and contain uppercase,
            lowercase, number, and special character
          </p>
        </div>
      )}

      <div>
        <label
          htmlFor="role"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Role <span className="text-red-500">*</span>
        </label>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              id="role"
              disabled={!canManageRoles && isEditMode}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select a role</option>
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        />
        {errors.role && (
          <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
        )}
      </div>

      {selectedRole === UserRole.TEST_TECHNICIAN && (
        <div>
          <label
            htmlFor="testTechnicianType"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Test Technician Type <span className="text-red-500">*</span>
          </label>
          <Controller
            name="testTechnicianType"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                id="testTechnicianType"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="">Select test technician type</option>
                {testAdminTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.testTechnicianType && (
            <p className="mt-1 text-sm text-red-600">
              {errors.testTechnicianType.message}
            </p>
          )}
        </div>
      )}

      {canManageRoles && (
        <div className="flex items-center">
          <Controller
            name="isActive"
            control={control}
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
          <label
            htmlFor="isActive"
            className="ml-2 block text-sm text-gray-900"
          >
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
          {isEditMode ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
};

