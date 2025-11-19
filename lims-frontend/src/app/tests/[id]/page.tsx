'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { RoleGuard } from '@/components/guards/RoleGuard/RoleGuard';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { TestView } from '@/components/tests/TestView/TestView';
import { testsService } from '@/services/api/tests.service';
import { Test } from '@/types/test.types';
import { UserRole } from '@/types/user.types';
import { PageLoader } from '@/components/common/Loading';
import { ErrorState } from '@/components/common/ErrorState';
import { getErrorMessage, transformError } from '@/utils/error-handler';
import { useUIStore } from '@/store/ui.store';

export default function TestDetailPage() {
  const params = useParams();
  const { addToast } = useUIStore();
  const testId = params.id as string;
  const [test, setTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTest = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await testsService.getTestById(testId);
        setTest(data);
      } catch (err) {
        const apiError = transformError(err);
        const errorMessage = getErrorMessage(apiError);
        setError(errorMessage);
        addToast({
          type: 'error',
          message: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (testId) {
      fetchTest();
    }
  }, [testId, addToast]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN]}>
          <MainLayout>
            <PageLoader />
          </MainLayout>
        </RoleGuard>
      </ProtectedRoute>
    );
  }

  if (error || !test) {
    return (
      <ProtectedRoute>
        <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN]}>
          <MainLayout>
            <ErrorState
              title="Test not found"
              message={error || 'The test you are looking for does not exist.'}
            />
          </MainLayout>
        </RoleGuard>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN]}>
          <MainLayout>
            <div className="px-4 py-6 sm:px-0">
              <TestView test={test} />
            </div>
          </MainLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}

