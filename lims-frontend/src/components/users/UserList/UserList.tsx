'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usersService } from '@/services/api/users.service';
import { User, UserRole, QueryUsersParams } from '@/types/user.types';
import { PaginatedUsersResponse } from '@/types/user.types';
import { UserTable } from '@/components/users/UserTable/UserTable';
import { UserFilters } from '@/components/users/UserFilters/UserFilters';
import { UserSearch } from '@/components/users/UserSearch/UserSearch';
import { Pagination } from '@/components/common/Pagination/Pagination';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { Button } from '@/components/common/Button/Button';
import { DeleteUserModal } from '@/components/users/DeleteUserModal/DeleteUserModal';
import { useDebounce } from '@/hooks/useDebounce/useDebounce';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { HasRole } from '@/components/common/HasRole/HasRole';
import { UserRole as Role } from '@/types/user.types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plus, Users as UsersIcon } from 'lucide-react';
import { Skeleton } from '@/components/common/Skeleton';

export const UserList: React.FC = () => {
  const router = useRouter();
  const { addToast } = useUIStore();

  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>();
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>();
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: QueryUsersParams = {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        role: roleFilter,
      };

      const response: PaginatedUsersResponse = await usersService.getUsers(
        params
      );

      setUsers(response.data);
      setPagination({
        page: response.meta.page,
        limit: response.meta.limit,
        total: response.meta.total,
        totalPages: response.meta.totalPages,
      });
    } catch (err) {
      const apiError = err as ApiError;
      setError(getErrorMessage(apiError));
      addToast({
        type: 'error',
        message: 'Failed to load users',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.limit, debouncedSearch, roleFilter]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleItemsPerPageChange = (limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleRoleFilterChange = (role: UserRole | undefined) => {
    setRoleFilter(role);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleActiveFilterChange = (active: boolean | undefined) => {
    setActiveFilter(active);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setRoleFilter(undefined);
    setActiveFilter(undefined);
    setSearchQuery('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleDeleteClick = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setUserToDelete(user);
      setDeleteModalOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      await usersService.deleteUser(userToDelete.id);
      addToast({
        type: 'success',
        message: 'User deleted successfully',
      });
      setDeleteModalOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (error && !isLoading) {
    return (
      <ErrorState
        title="Failed to load users"
        message={error}
        onRetry={fetchUsers}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UsersIcon className="h-8 w-8 text-primary" />
            Users
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage system users and their roles
          </p>
        </div>
        <HasRole allowedRoles={[Role.SUPER_ADMIN]}>
          <Button
            variant="primary"
            onClick={() => router.push('/users/new')}
            size="default"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        </HasRole>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <UserSearch value={searchQuery} onChange={handleSearchChange} />
            </div>
            <UserFilters
              roleFilter={roleFilter}
              onRoleFilterChange={handleRoleFilterChange}
              activeFilter={activeFilter}
              onActiveFilterChange={handleActiveFilterChange}
              onReset={handleResetFilters}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} height="h-12" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              title="No users found"
              message="Try adjusting your search or filters to find what you're looking for."
              action={
                <Button variant="outline" onClick={handleResetFilters}>
                  Clear Filters
                </Button>
              }
            />
          ) : (
            <>
              <div className="rounded-md border">
                <UserTable users={users} onDelete={handleDeleteClick} />
              </div>
              {pagination.totalPages > 0 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.total}
                    itemsPerPage={pagination.limit}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {userToDelete && (
        <DeleteUserModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setUserToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          userName={userToDelete.fullName}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};
