'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { RoleGuard } from '@/components/guards/RoleGuard/RoleGuard';
import { PatientProgressDashboard } from '@/components/patients/PatientProgressDashboard/PatientProgressDashboard';
import { UserRole } from '@/types/user.types';

export default function PatientProgressPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={[UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN]}>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0">
            <PatientProgressDashboard />
          </div>
        </MainLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}

