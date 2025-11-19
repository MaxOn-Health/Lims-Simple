import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { RoleGuard } from '@/components/guards/RoleGuard/RoleGuard';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { PackageTestsManager } from '@/components/packages/PackageTestsManager/PackageTestsManager';
import { UserRole } from '@/types/user.types';

export default function PackageTestsPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN]}>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0">
            <PackageTestsManager />
          </div>
        </MainLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}

