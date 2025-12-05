'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/api/auth.service';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { Lock, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';

const resetPasswordSchema = z
    .object({
        newPassword: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordForm: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const onSubmit = async (data: ResetPasswordFormData) => {
        if (!token) {
            setError('Invalid reset link. Please request a new password reset.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await authService.resetPassword(token, data.newPassword);
            setIsSuccess(true);
        } catch (err) {
            const apiError = err as ApiError;
            setError(getErrorMessage(apiError));
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="text-center space-y-4">
                <div className="flex justify-center">
                    <AlertTriangle className="h-16 w-16 text-yellow-500" />
                </div>
                <h2 className="text-2xl font-bold">Invalid Reset Link</h2>
                <p className="text-muted-foreground">
                    This password reset link is invalid or has expired.
                </p>
                <Link href="/forgot-password">
                    <Button variant="primary" className="mt-4">
                        Request New Reset Link
                    </Button>
                </Link>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="text-center space-y-4">
                <div className="flex justify-center">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold">Password Reset Successful</h2>
                <p className="text-muted-foreground">
                    Your password has been reset. You can now log in with your new password.
                </p>
                <Link href="/login">
                    <Button variant="primary" className="mt-4">
                        Go to Login
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="flex justify-center">
                    <Lock className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Reset Your Password</h2>
                <p className="text-muted-foreground">
                    Enter your new password below.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    id="newPassword"
                    type="password"
                    label="New Password"
                    placeholder="Enter new password"
                    required
                    error={errors.newPassword?.message}
                    {...register('newPassword')}
                />

                <Input
                    id="confirmPassword"
                    type="password"
                    label="Confirm Password"
                    placeholder="Confirm new password"
                    required
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                />

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
                    Reset Password
                </Button>

                <div className="text-center">
                    <Link
                        href="/login"
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Login
                    </Link>
                </div>
            </form>
        </div>
    );
};
