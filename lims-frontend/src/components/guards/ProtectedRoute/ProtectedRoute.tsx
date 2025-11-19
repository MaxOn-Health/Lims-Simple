'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { PageLoader } from '@/components/common/Loading/PageLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const router = useRouter();
  const { isAuthenticated, user, isLoading, getCurrentUser } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      const token = typeof window !== 'undefined' 
        ? localStorage.getItem('lims_access_token')
        : null;

      if (!token) {
        router.push('/login');
        return;
      }

      if (!isAuthenticated) {
        try {
          await getCurrentUser();
        } catch {
          router.push('/login');
        }
      } else if (requiredRole && user?.role !== requiredRole) {
        router.push('/dashboard');
      }
    };

    checkAuth();
  }, [isAuthenticated, user, router, getCurrentUser, requiredRole]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <PageLoader />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <PageLoader />;
  }

  return <>{children}</>;
};

