'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { RoleGuard } from '@/components/guards/RoleGuard/RoleGuard';
import { MyAssignmentsDashboard } from '@/components/assignments/MyAssignmentsDashboard/MyAssignmentsDashboard';
import { UserRole } from '@/types/user.types';

export default function MyAssignmentsPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={[UserRole.TEST_TECHNICIAN, UserRole.LAB_TECHNICIAN]}>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0">
            <MyAssignmentsDashboard />
          </div>
        </MainLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}

