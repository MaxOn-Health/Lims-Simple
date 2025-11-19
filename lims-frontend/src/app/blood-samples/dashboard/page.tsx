'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { RoleGuard } from '@/components/guards/RoleGuard/RoleGuard';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { LabTechDashboard } from '@/components/blood-samples/LabTechDashboard/LabTechDashboard';
import { UserRole } from '@/types/user.types';

export default function LabTechDashboardPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={[UserRole.LAB_TECHNICIAN]}>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0">
            <LabTechDashboard />
          </div>
        </MainLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}

