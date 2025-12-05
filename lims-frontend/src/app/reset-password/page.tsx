'use client';

import { Suspense } from 'react';
import { AuthLayout } from '@/components/layouts/AuthLayout/AuthLayout';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm/ResetPasswordForm';
import { PageLoader } from '@/components/common/Loading/PageLoader';

function ResetPasswordContent() {
    return <ResetPasswordForm />;
}

export default function ResetPasswordPage() {
    return (
        <AuthLayout>
            <Suspense fallback={<PageLoader />}>
                <ResetPasswordContent />
            </Suspense>
        </AuthLayout>
    );
}
