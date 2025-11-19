'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Test } from '@/types/test.types';
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/common/Table/Table';
import { Button } from '@/components/common/Button/Button';

interface TestTableProps {
  tests: Test[];
  onDelete?: (testId: string) => void;
  isLoading?: boolean;
}

export const TestTable: React.FC<TestTableProps> = ({
  tests,
  onDelete,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-10 bg-gray-200 rounded flex-1" />
              <div className="h-10 bg-gray-200 rounded flex-1" />
              <div className="h-10 bg-gray-200 rounded flex-1" />
              <div className="h-10 bg-gray-200 rounded flex-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tests.length === 0) {
    return null; // Empty state handled by parent
  }

  const formatNormalRange = (test: Test): string => {
    if (test.normalRangeMin !== null && test.normalRangeMax !== null) {
      const unit = test.unit ? ` ${test.unit}` : '';
      return `${test.normalRangeMin} - ${test.normalRangeMax}${unit}`;
    }
    return '—';
  };

  return (
    <Table>
      <TableHeader>
        <TableHeaderCell>Name</TableHeaderCell>
        <TableHeaderCell>Category</TableHeaderCell>
        <TableHeaderCell>Admin Role</TableHeaderCell>
        <TableHeaderCell>Normal Range</TableHeaderCell>
        <TableHeaderCell>Fields</TableHeaderCell>
        <TableHeaderCell>Status</TableHeaderCell>
        <TableHeaderCell>Created Date</TableHeaderCell>
        <TableHeaderCell>Actions</TableHeaderCell>
      </TableHeader>
      <TableBody>
        {tests.map((test) => (
          <TableRow key={test.id}>
            <TableCell>
              <Link
                href={`/tests/${test.id}`}
                className="text-primary-600 hover:text-primary-800 font-medium"
              >
                {test.name}
              </Link>
            </TableCell>
            <TableCell>
              <span className="text-sm text-gray-600 capitalize">
                {test.category.replace('_', ' ')}
              </span>
            </TableCell>
            <TableCell>
              <span className="text-sm text-gray-600 capitalize">
                {test.adminRole.replace('_', ' ')}
              </span>
            </TableCell>
            <TableCell>
              <span className="text-sm text-gray-600">{formatNormalRange(test)}</span>
            </TableCell>
            <TableCell>
              <span className="text-sm text-gray-600">
                {test.testFields?.length || 0} field{test.testFields?.length !== 1 ? 's' : ''}
              </span>
            </TableCell>
            <TableCell>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  test.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {test.isActive ? 'Active' : 'Inactive'}
              </span>
            </TableCell>
            <TableCell>
              <span className="text-sm text-gray-600">
                {format(new Date(test.createdAt), 'MMM dd, yyyy')}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Link href={`/tests/${test.id}`}>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </Link>
                <Link href={`/tests/${test.id}/edit`}>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </Link>
                {onDelete && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onDelete(test.id)}
                  >
                    Delete
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

