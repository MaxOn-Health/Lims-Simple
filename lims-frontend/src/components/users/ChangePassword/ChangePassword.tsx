'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useParams } from 'next/navigation';
import { changePasswordSchema, ChangePasswordFormData } from '@/utils/validation/user-schemas';
import { checkPasswordStrength } from '@/utils/validation/password-schemas';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import { usersService } from '@/services/api/users.service';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';

export const ChangePassword: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { addToast } = useUIStore();

  const [passwordStrength, setPasswordStrength] = useState<{
    strength: 'weak' | 'medium' | 'strong';
    score: number;
    feedback: string[];
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const newPassword = watch('newPassword');

  React.useEffect(() => {
    if (newPassword) {
      setPasswordStrength(checkPasswordStrength(newPassword));
    } else {
      setPasswordStrength(null);
    }
  }, [newPassword]);

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      await usersService.changePassword(userId, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      addToast({
        type: 'success',
        message: 'Password changed successfully',
      });

      router.back();
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError),
      });
    }
  };

  const getStrengthColor = () => {
    if (!passwordStrength) return 'bg-gray-200';
    switch (passwordStrength.strength) {
      case 'weak':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'strong':
        return 'bg-green-500';
      default:
        return 'bg-gray-200';
    }
  };

  const getStrengthText = () => {
    if (!passwordStrength) return '';
    return passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Input
          id="currentPassword"
          type="password"
          label="Current Password"
          placeholder="Enter current password"
          required
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
      </div>

      <div>
        <Input
          id="newPassword"
          type="password"
          label="New Password"
          placeholder="Enter new password"
          required
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        {passwordStrength && (
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getStrengthColor()}`}
                  style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-700">
                {getStrengthText()}
              </span>
            </div>
            {passwordStrength.feedback.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Missing: {passwordStrength.feedback.join(', ')}
              </p>
            )}
          </div>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Password must be at least 8 characters and contain uppercase,
          lowercase, number, and special character
        </p>
      </div>

      <div>
        <Input
          id="confirmPassword"
          type="password"
          label="Confirm Password"
          placeholder="Confirm new password"
          required
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
      </div>

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
          Change Password
        </Button>
      </div>
    </form>
  );
};

