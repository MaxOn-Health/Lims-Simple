'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { RoleGuard } from '@/components/guards/RoleGuard/RoleGuard';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { PatientResultsView } from '@/components/doctor/PatientResultsView/PatientResultsView';
import { UserRole } from '@/types/user.types';

export default function PatientReviewPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={[UserRole.DOCTOR]}>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0">
            <PatientResultsView />
          </div>
        </MainLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}

