'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { AssignmentList } from '@/components/assignments/AssignmentList/AssignmentList';

export default function AssignmentsPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="px-4 py-6 sm:px-0">
          <AssignmentList />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

