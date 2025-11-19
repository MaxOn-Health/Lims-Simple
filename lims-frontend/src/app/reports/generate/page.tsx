'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { RoleGuard } from '@/components/guards/RoleGuard/RoleGuard';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { ReportGeneration } from '@/components/reports/ReportGeneration/ReportGeneration';
import { UserRole } from '@/types/user.types';

export default function GenerateReportPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={[UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN, UserRole.DOCTOR]}>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Generate Report</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Generate a new laboratory report for a patient
                </p>
              </div>
              <ReportGeneration />
            </div>
          </div>
        </MainLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}



