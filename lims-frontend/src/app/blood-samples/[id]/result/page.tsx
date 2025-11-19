'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { RoleGuard } from '@/components/guards/RoleGuard/RoleGuard';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { BloodResultForm } from '@/components/blood-samples/BloodResultForm/BloodResultForm';
import { UserRole } from '@/types/user.types';

export default function BloodResultSubmissionPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={[UserRole.LAB_TECHNICIAN, UserRole.SUPER_ADMIN]}>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0">
            <BloodResultForm />
          </div>
        </MainLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}

