'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';

export default function TestResultsPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Test Results</h1>
            <p className="mt-1 text-sm text-gray-600">
              View and manage laboratory test results
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-12">
            <EmptyState
              title="Coming Soon"
              message="Test results management features will be available in a future release."
              icon={
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              }
            />
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

