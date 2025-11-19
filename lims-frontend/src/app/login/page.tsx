'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { AuthLayout } from '@/components/layouts/AuthLayout/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm/LoginForm';
import { PageLoader } from '@/components/common/Loading/PageLoader';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return <PageLoader />;
  }

  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}

