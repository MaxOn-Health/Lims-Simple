'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { RoleGuard } from '@/components/guards/RoleGuard/RoleGuard';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { SignedReportsList } from '@/components/doctor/SignedReportsList/SignedReportsList';
import { UserRole } from '@/types/user.types';

export default function SignedReportsPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={[UserRole.DOCTOR]}>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0">
            <SignedReportsList />
          </div>
        </MainLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}

