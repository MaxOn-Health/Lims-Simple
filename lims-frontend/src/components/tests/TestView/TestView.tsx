'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Test, TestFieldType } from '@/types/test.types';
import { Button } from '@/components/common/Button/Button';
import { testsService } from '@/services/api/tests.service';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/common/Table/Table';

interface TestViewProps {
  test: Test;
}

const getFieldTypeLabel = (type: TestFieldType): string => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

export const TestView: React.FC<TestViewProps> = ({ test }) => {
  const router = useRouter();
  const { addToast } = useUIStore();

  const formatNormalRange = (): string => {
    if (test.normalRangeMin !== null && test.normalRangeMax !== null) {
      const unit = test.unit ? ` ${test.unit}` : '';
      return `${test.normalRangeMin} - ${test.normalRangeMax}${unit}`;
    }
    return 'Not specified';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{test.name}</h1>
            {test.description && (
              <p className="mt-2 text-gray-600">{test.description}</p>
            )}
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              test.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {test.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Category</p>
            <p className="text-lg font-semibold text-gray-900 mt-1 capitalize">
              {test.category.replace('_', ' ')}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Admin Role</p>
            <p className="text-lg font-semibold text-gray-900 mt-1 capitalize">
              {test.adminRole.replace('_', ' ')}
            </p>
          </div>
        </div>

        {(test.normalRangeMin !== null ||
          test.normalRangeMax !== null ||
          test.unit) && (
          <div className="border-t border-gray-200 pt-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Normal Range</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Range</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {formatNormalRange()}
              </p>
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Test Fields ({test.testFields?.length || 0})
          </h2>

          {test.testFields && test.testFields.length > 0 ? (
            <Table>
              <TableHeader>
                <TableHeaderCell>Field Name</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Required</TableHeaderCell>
                <TableHeaderCell>Options</TableHeaderCell>
              </TableHeader>
              <TableBody>
                {test.testFields.map((field, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <span className="font-medium text-gray-900">
                        {field.field_name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {getFieldTypeLabel(field.field_type)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          field.required
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {field.required ? 'Required' : 'Optional'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {field.options && field.options.length > 0 ? (
                        <span className="text-sm text-gray-600">
                          {field.options.join(', ')}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No test fields defined.</p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-6 mt-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Created</p>
              <p className="text-gray-900 mt-1">
                {format(new Date(test.createdAt), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Last Updated</p>
              <p className="text-gray-900 mt-1">
                {format(new Date(test.updatedAt), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href={`/tests/${test.id}/edit`}>
          <Button variant="primary">Edit Test</Button>
        </Link>
      </div>
    </div>
  );
};

