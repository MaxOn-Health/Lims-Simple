'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { RoleGuard } from '@/components/guards/RoleGuard/RoleGuard';
import { ManualAssignForm } from '@/components/assignments/ManualAssignForm/ManualAssignForm';
import { UserRole } from '@/types/user.types';

export default function ManualAssignPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={[UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN]}>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0">
            <ManualAssignForm />
          </div>
        </MainLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}

