'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { RoleGuard } from '@/components/guards/RoleGuard/RoleGuard';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { UserList } from '@/components/users/UserList/UserList';
import { AdminRolesManager } from '@/components/users/AdminRolesManager';
import { UserRole } from '@/types/user.types';

export default function UsersPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN]}>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0 space-y-8">
            <UserList />
            <AdminRolesManager />
          </div>
        </MainLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}

