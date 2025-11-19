'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { RoleGuard } from '@/components/guards/RoleGuard/RoleGuard';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { PatientForm } from '@/components/patients/PatientForm/PatientForm';
import { UserRole } from '@/types/user.types';
import { Skeleton } from '@/components/common/Skeleton';

export default function NewPatientPage() {
  const router = useRouter();

  const handleSuccess = (patientId: string) => {
    // PatientForm already handles navigation, but we can add additional logic here if needed
  };

  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={[UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN]}>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0">
            <PatientForm onSuccess={handleSuccess} />
          </div>
        </MainLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}

