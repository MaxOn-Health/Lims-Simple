'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { ResultEditForm } from '@/components/results/ResultEditForm/ResultEditForm';
import { RoleGuard } from '@/components/guards/RoleGuard/RoleGuard';
import { UserRole } from '@/types/user.types';

export default function ResultEditPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN]}>
          <div className="px-4 py-6 sm:px-0">
            <ResultEditForm />
          </div>
        </RoleGuard>
      </MainLayout>
    </ProtectedRoute>
  );
}

