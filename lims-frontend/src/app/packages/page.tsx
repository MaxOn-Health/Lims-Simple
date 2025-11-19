'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { RoleGuard } from '@/components/guards/RoleGuard/RoleGuard';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { PackageList } from '@/components/packages/PackageList/PackageList';
import { UserRole } from '@/types/user.types';

export default function PackagesPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN]}>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0">
            <PackageList />
          </div>
        </MainLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}

