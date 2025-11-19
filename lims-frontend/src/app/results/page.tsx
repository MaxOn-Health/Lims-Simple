'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { ResultList } from '@/components/results/ResultList/ResultList';

export default function ResultsPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="px-4 py-6 sm:px-0">
          <ResultList />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

