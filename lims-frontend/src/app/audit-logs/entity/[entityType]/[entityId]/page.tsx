'use client';

import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { RoleGuard } from '@/components/guards/RoleGuard/RoleGuard';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { EntityAuditTrail } from '@/components/audit/EntityAuditTrail/EntityAuditTrail';
import { UserRole } from '@/types/user.types';
import { useParams } from 'next/navigation';

export default function EntityAuditTrailPage() {
  const params = useParams();
  const entityType = params.entityType as string;
  const entityId = params.entityId as string;

  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN]}>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0">
            <EntityAuditTrail entityType={entityType} entityId={entityId} />
          </div>
        </MainLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}



