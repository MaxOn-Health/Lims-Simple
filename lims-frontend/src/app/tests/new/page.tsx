import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { RoleGuard } from '@/components/guards/RoleGuard/RoleGuard';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { TestForm } from '@/components/tests/TestForm/TestForm';
import { UserRole } from '@/types/user.types';

export default function CreateTestPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN]}>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Test</h1>
              <div className="bg-white shadow-sm rounded-lg p-6">
                <TestForm mode="create" />
              </div>
            </div>
          </div>
        </MainLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}

