'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User } from '@/types/user.types';
import { UserCard } from '@/components/users/UserCard/UserCard';
import { Button } from '@/components/common/Button/Button';
import { DeleteUserModal } from '@/components/users/DeleteUserModal/DeleteUserModal';
import { usersService } from '@/services/api/users.service';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { canEditUser, canDeleteUser } from '@/utils/rbac/role-helpers';
import { useAuthStore } from '@/store/auth.store';

interface UserViewProps {
  user: User;
}

export const UserView: React.FC<UserViewProps> = ({ user }) => {
  const router = useRouter();
  const { addToast } = useUIStore();
  const { user: currentUser } = useAuthStore();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await usersService.deleteUser(user.id);
      addToast({
        type: 'success',
        message: 'User deleted successfully',
      });
      router.push('/users');
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError),
      });
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <UserCard user={user} />

      <div className="flex flex-wrap gap-3">
        {canEditUser(currentUser, user.id) && (
          <Link href={`/users/${user.id}/edit`}>
            <Button variant="primary">Edit User</Button>
          </Link>
        )}

        {canDeleteUser(currentUser, user.id) && (
          <Button
            variant="danger"
            onClick={() => setDeleteModalOpen(true)}
          >
            Delete User
          </Button>
        )}

        {canEditUser(currentUser, user.id) && (
          <Link href={`/users/${user.id}/change-password`}>
            <Button variant="outline">Change Password</Button>
          </Link>
        )}
      </div>

      <DeleteUserModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        userName={user.fullName}
        isLoading={isDeleting}
      />
    </div>
  );
};

