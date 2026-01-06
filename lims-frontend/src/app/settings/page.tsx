'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { SecuritySettings } from '@/components/security/SecuritySettings/SecuritySettings';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your account settings and security preferences.
            </p>
          </div>
          <SecuritySettings />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

