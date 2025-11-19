'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { ResultEntryForm } from '@/components/results/ResultEntryForm/ResultEntryForm';
import { RoleGuard } from '@/components/guards/RoleGuard/RoleGuard';
import { UserRole } from '@/types/user.types';

export default function ResultEntryPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <RoleGuard allowedRoles={[UserRole.TEST_TECHNICIAN, UserRole.LAB_TECHNICIAN]}>
          <div className="px-4 py-6 sm:px-0">
            <ResultEntryForm />
          </div>
        </RoleGuard>
      </MainLayout>
    </ProtectedRoute>
  );
}

