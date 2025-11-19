'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { PatientResultsView } from '@/components/results/PatientResultsView/PatientResultsView';

export default function PatientResultsPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="px-4 py-6 sm:px-0">
          <PatientResultsView />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

