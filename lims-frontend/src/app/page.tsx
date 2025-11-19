'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { PageLoader } from '@/components/common/Loading/PageLoader';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, getCurrentUser } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('lims_access_token')
          : null;

      if (token && !isAuthenticated) {
        try {
          await getCurrentUser();
        } catch {
          router.push('/login');
          return;
        }
      }

      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    };

    checkAuth();
  }, [isAuthenticated, router, getCurrentUser]);

  return <PageLoader />;
}

