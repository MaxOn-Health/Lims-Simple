'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';

export default function TestOrdersPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Test Orders</h1>
            <p className="mt-1 text-sm text-gray-600">
              Create and manage laboratory test orders
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-12">
            <EmptyState
              title="Coming Soon"
              message="Test order management features will be available in a future release."
              icon={
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

