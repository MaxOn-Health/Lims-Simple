'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { RoleGuard } from '@/components/guards/RoleGuard/RoleGuard';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { UserForm } from '@/components/users/UserForm/UserForm';
import { UserRole } from '@/types/user.types';

export default function CreateUserPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN]}>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Create User</h1>
              <p className="mt-1 text-sm text-gray-600">
                Add a new user to the system
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <UserForm mode="create" />
            </div>
          </div>
        </MainLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}

