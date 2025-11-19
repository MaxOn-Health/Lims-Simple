'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { RoleGuard } from '@/components/guards/RoleGuard/RoleGuard';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { PackageForm } from '@/components/packages/PackageForm/PackageForm';
import { UserRole } from '@/types/user.types';

export default function CreatePackagePage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN]}>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0">
            <div className="max-w-2xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Package</h1>
              <div className="bg-white shadow-sm rounded-lg p-6">
                <PackageForm mode="create" />
              </div>
            </div>
          </div>
        </MainLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}

