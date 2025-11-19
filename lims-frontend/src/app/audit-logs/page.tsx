'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { RoleGuard } from '@/components/guards/RoleGuard/RoleGuard';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { AuditLogList } from '@/components/audit/AuditLogList/AuditLogList';
import { UserRole } from '@/types/user.types';

export default function AuditLogsPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN]}>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  View system activity and track changes across the platform
                </p>
              </div>
              <AuditLogList />
            </div>
          </div>
        </MainLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}



