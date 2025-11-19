'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { RoleGuard } from '@/components/guards/RoleGuard/RoleGuard';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { SampleRegistrationForm } from '@/components/blood-samples/SampleRegistrationForm/SampleRegistrationForm';
import { UserRole } from '@/types/user.types';

export default function RegisterBloodSamplePage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={[UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN]}>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0">
            <SampleRegistrationForm />
          </div>
        </MainLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}

