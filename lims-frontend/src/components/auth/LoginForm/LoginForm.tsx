'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { loginSchema, LoginFormData } from '@/utils/validation/schemas';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    try {
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch (err) {
      // Error is handled by the auth store
      const apiError = err as ApiError;
      console.error('Login error:', getErrorMessage(apiError));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Input
          id="email"
          type="email"
          label="Email"
          placeholder="Enter your email"
          required
          error={errors.email?.message}
          {...register('email')}
        />
      </div>

      <div>
        <Input
          id="password"
          type="password"
          label="Password"
          placeholder="Enter your password"
          required
          error={errors.password?.message}
          {...register('password')}
        />
      </div>

      {error && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
          role="alert"
        >
          {error}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        fullWidth
        isLoading={isLoading}
        disabled={isLoading}
      >
        Sign In
      </Button>
    </form>
  );
};

