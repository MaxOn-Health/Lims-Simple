'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { ChangePassword } from '@/components/users/ChangePassword/ChangePassword';

export default function ChangePasswordPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Change Password
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Update your password
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <ChangePassword />
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

