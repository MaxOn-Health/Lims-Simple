'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { RoleGuard } from '@/components/guards/RoleGuard/RoleGuard';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { PasskeySetup } from '@/components/doctor/PasskeySetup/PasskeySetup';
import { UserRole } from '@/types/user.types';

export default function PasskeySettingsPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={[UserRole.DOCTOR]}>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Passkey Settings</h1>
                <p className="text-muted-foreground mt-1">
                  Manage your passkey for signing patient reports
                </p>
              </div>
              <PasskeySetup />
            </div>
          </div>
        </MainLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}

