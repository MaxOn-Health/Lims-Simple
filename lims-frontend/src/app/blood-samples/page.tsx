'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { SampleList } from '@/components/blood-samples/SampleList/SampleList';

export default function BloodSamplesListPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="px-4 py-6 sm:px-0">
          <SampleList />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

