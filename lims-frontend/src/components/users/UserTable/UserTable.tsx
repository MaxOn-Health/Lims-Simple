'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { User } from '@/types/user.types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/common/Button/Button';
import { Badge } from '@/components/ui/badge';
import { getRoleDisplayName, getRoleColor } from '@/utils/rbac/role-helpers';
import { useAuthStore } from '@/store/auth.store';
import { canEditUser, canDeleteUser } from '@/utils/rbac/role-helpers';
import { Eye, Edit, Trash2 } from 'lucide-react';

interface UserTableProps {
  users: User[];
  onDelete?: (userId: string) => void;
  isLoading?: boolean;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  onDelete,
  isLoading = false,
}) => {
  const { user: currentUser } = useAuthStore();

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-10 bg-muted rounded flex-1" />
              <div className="h-10 bg-muted rounded flex-1" />
              <div className="h-10 bg-muted rounded flex-1" />
              <div className="h-10 bg-muted rounded flex-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return null; // Empty state handled by parent
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-semibold">Name</TableHead>
          <TableHead className="font-semibold">Email</TableHead>
          <TableHead className="font-semibold">Role</TableHead>
          <TableHead className="font-semibold">Test Admin Type</TableHead>
          <TableHead className="font-semibold">Status</TableHead>
          <TableHead className="font-semibold">Created Date</TableHead>
          <TableHead className="font-semibold text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id} className="hover:bg-muted/50">
            <TableCell>
              <Link
                href={`/users/${user.id}`}
                className="font-medium text-primary hover:underline"
              >
                {user.fullName}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">{user.email}</TableCell>
            <TableCell>
              <Badge variant="secondary" className="capitalize">
                {getRoleDisplayName(user.role)}
              </Badge>
            </TableCell>
            <TableCell>
              {user.testTechnicianType ? (
                <Badge variant="outline" className="capitalize">
                  {user.testTechnicianType.replace('_', ' ')}
                </Badge>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              <Badge variant={user.isActive ? 'default' : 'secondary'}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {format(new Date(user.createdAt), 'MMM dd, yyyy')}
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-2">
                <Link href={`/users/${user.id}`}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View</span>
                  </Button>
                </Link>
                {canEditUser(currentUser, user.id) && (
                  <Link href={`/users/${user.id}/edit`}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                  </Link>
                )}
                {canDeleteUser(currentUser, user.id) && onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => onDelete(user.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};


