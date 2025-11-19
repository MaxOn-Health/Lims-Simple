'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { PatientList } from '@/components/patients/PatientList/PatientList';

export default function PatientsPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="px-4 py-6 sm:px-0">
          <PatientList />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
