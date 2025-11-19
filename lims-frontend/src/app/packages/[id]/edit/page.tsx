'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { RoleGuard } from '@/components/guards/RoleGuard/RoleGuard';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { PackageForm } from '@/components/packages/PackageForm/PackageForm';
import { packagesService } from '@/services/api/packages.service';
import { Package } from '@/types/package.types';
import { UserRole } from '@/types/user.types';
import { PageLoader } from '@/components/common/Loading';
import { ErrorState } from '@/components/common/ErrorState';
import { getErrorMessage, transformError } from '@/utils/error-handler';
import { useUIStore } from '@/store/ui.store';

export default function EditPackagePage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useUIStore();
  const packageId = params.id as string;
  const [pkg, setPackage] = useState<Package | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackage = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await packagesService.getPackageById(packageId);
        setPackage(data);
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

    if (packageId) {
      fetchPackage();
    }
  }, [packageId, addToast]);

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

  if (error || !pkg) {
    return (
      <ProtectedRoute>
        <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN]}>
          <MainLayout>
            <ErrorState
              title="Package not found"
              message={error || 'The package you are looking for does not exist.'}
              onRetry={() => router.push('/packages')}
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
              <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Package: {pkg.name}</h1>
                <div className="bg-white shadow-sm rounded-lg p-6">
                  <PackageForm package={pkg} mode="edit" />
                </div>
              </div>
            </div>
          </MainLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}

