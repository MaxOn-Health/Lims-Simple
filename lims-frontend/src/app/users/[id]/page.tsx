'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { UserView } from '@/components/users/UserView/UserView';
import { User } from '@/types/user.types';
import { usersService } from '@/services/api/users.service';
import { PageLoader } from '@/components/common/Loading/PageLoader';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { canEditUser } from '@/utils/rbac/role-helpers';
import { useAuthStore } from '@/store/auth.store';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useUIStore();
  const { user: currentUser } = useAuthStore();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const userData = await usersService.getUserById(userId);

        // Check if user can view this user
        if (!canEditUser(currentUser, userId)) {
          setError('You do not have permission to view this user');
          return;
        }

        setUser(userData);
      } catch (err) {
        const apiError = err as ApiError;
        setError(getErrorMessage(apiError));
        addToast({
          type: 'error',
          message: 'Failed to load user',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId, currentUser, addToast]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <PageLoader />
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (error || !user) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0">
            <ErrorState
              title="Failed to load user"
              message={error || 'User not found'}
              onRetry={() => router.push('/users')}
            />
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
          </div>
          <UserView user={user} />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

