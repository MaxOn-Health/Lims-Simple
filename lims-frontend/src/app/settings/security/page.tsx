'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { SecuritySettings } from '@/components/security/SecuritySettings/SecuritySettings';

export default function SecuritySettingsPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Security Settings</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your security preferences and view security information
              </p>
            </div>
            <SecuritySettings />
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}



