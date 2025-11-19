'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { ReportView } from '@/components/reports/ReportView/ReportView';
import { useParams } from 'next/navigation';

export default function ReportDetailPage() {
  const params = useParams();
  const reportId = params.id as string;

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Report Details</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                View detailed information and PDF of the report
              </p>
            </div>
            <ReportView reportId={reportId} />
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}



