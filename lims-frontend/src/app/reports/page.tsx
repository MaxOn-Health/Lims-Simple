'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { RoleGuard } from '@/components/guards/RoleGuard/RoleGuard';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { ReportList } from '@/components/reports/ReportList/ReportList';
import { UserRole } from '@/types/user.types';

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={[UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN, UserRole.DOCTOR]}>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Generate and view laboratory reports
                </p>
              </div>
              <ReportList />
            </div>
          </div>
        </MainLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}
