'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { authService } from '@/services/api/auth.service';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordForm: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            await authService.forgotPassword(data.email);
            setIsSuccess(true);
        } catch (err) {
            const apiError = err as ApiError;
            setError(getErrorMessage(apiError));
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="text-center space-y-4">
                <div className="flex justify-center">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold">Check Your Email</h2>
                <p className="text-muted-foreground">
                    If an account exists with that email, we've sent password reset instructions.
                </p>
                <p className="text-sm text-muted-foreground">
                    Check your backend console for the reset token (email not configured).
                </p>
                <Link href="/login">
                    <Button variant="outline" className="mt-4 gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Login
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="flex justify-center">
                    <Mail className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Forgot Password?</h2>
                <p className="text-muted-foreground">
                    Enter your email and we'll send you reset instructions.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    id="email"
                    type="email"
                    label="Email Address"
                    placeholder="Enter your email"
                    required
                    error={errors.email?.message}
                    {...register('email')}
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
                    Send Reset Link
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
