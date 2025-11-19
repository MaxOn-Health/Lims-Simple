'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { RoleGuard } from '@/components/guards/RoleGuard/RoleGuard';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { TestForm } from '@/components/tests/TestForm/TestForm';
import { testsService } from '@/services/api/tests.service';
import { Test } from '@/types/test.types';
import { UserRole } from '@/types/user.types';
import { PageLoader } from '@/components/common/Loading';
import { ErrorState } from '@/components/common/ErrorState';
import { getErrorMessage, transformError } from '@/utils/error-handler';
import { useUIStore } from '@/store/ui.store';

export default function EditTestPage() {
  const params = useParams();
  const router = useRouter();
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
              onRetry={() => router.push('/tests')}
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
              <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Test: {test.name}</h1>
                <div className="bg-white shadow-sm rounded-lg p-6">
                  <TestForm test={test} mode="edit" />
                </div>
              </div>
            </div>
          </MainLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}

