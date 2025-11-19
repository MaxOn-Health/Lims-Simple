'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Package } from '@/types/package.types';
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
import { HasRole } from '@/components/common/HasRole';
import { UserRole } from '@/types/user.types';
import { Eye, Edit, Settings, Trash2 } from 'lucide-react';

interface PackageTableProps {
  packages: Package[];
  onDelete?: (packageId: string) => void;
  isLoading?: boolean;
}

export const PackageTable: React.FC<PackageTableProps> = ({
  packages,
  onDelete,
  isLoading = false,
}) => {
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

  if (packages.length === 0) {
    return null; // Empty state handled by parent
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-semibold">Name</TableHead>
          <TableHead className="font-semibold">Description</TableHead>
          <TableHead className="font-semibold">Price</TableHead>
          <TableHead className="font-semibold">Validity Days</TableHead>
          <TableHead className="font-semibold">Tests</TableHead>
          <TableHead className="font-semibold">Status</TableHead>
          <TableHead className="font-semibold">Created Date</TableHead>
          <TableHead className="font-semibold text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {packages.map((pkg) => (
          <TableRow key={pkg.id} className="hover:bg-muted/50">
            <TableCell>
              <Link
                href={`/packages/${pkg.id}`}
                className="font-medium text-primary hover:underline"
              >
                {pkg.name}
              </Link>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground line-clamp-1">
                {pkg.description || '—'}
              </span>
            </TableCell>
            <TableCell>
              <span className="text-sm font-medium text-foreground">
                ₹{Number(pkg.price).toFixed(2)}
              </span>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">{pkg.validityDays} days</span>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">
                {pkg.tests?.length || 0}
              </span>
            </TableCell>
            <TableCell>
              <Badge variant={pkg.isActive ? 'default' : 'secondary'}>
                {pkg.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {format(new Date(pkg.createdAt), 'MMM dd, yyyy')}
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-2">
                <Link href={`/packages/${pkg.id}`}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View</span>
                  </Button>
                </Link>
                <HasRole allowedRoles={[UserRole.SUPER_ADMIN]}>
                  <Link href={`/packages/${pkg.id}/edit`}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                  </Link>
                  <Link href={`/packages/${pkg.id}/tests`}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Settings className="h-4 w-4" />
                      <span className="sr-only">Manage Tests</span>
                    </Button>
                  </Link>
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => onDelete(pkg.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  )}
                </HasRole>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

