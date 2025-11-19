'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { ProjectList } from '@/components/projects/ProjectList/ProjectList';

export default function ProjectsPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="px-4 py-6 sm:px-0">
          <ProjectList />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

