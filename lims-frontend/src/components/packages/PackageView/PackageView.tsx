'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Package } from '@/types/package.types';
import { Button } from '@/components/common/Button/Button';
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/common/Table/Table';

interface PackageViewProps {
  package: Package;
}

export const PackageView: React.FC<PackageViewProps> = ({ package: pkg }) => {
  const totalPackageValue = pkg.tests?.reduce((sum, test) => {
    return sum + (test.testPrice || 0);
  }, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{pkg.name}</h1>
            {pkg.description && (
              <p className="mt-2 text-gray-600">{pkg.description}</p>
            )}
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              pkg.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {pkg.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Price</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              ₹{Number(pkg.price).toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Validity Period</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {pkg.validityDays} days
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Tests Count</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {pkg.tests?.length || 0}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Associated Tests
            </h2>
            <Link href={`/packages/${pkg.id}/tests`}>
              <Button variant="outline" size="sm">
                Manage Tests
              </Button>
            </Link>
          </div>

          {pkg.tests && pkg.tests.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableHeaderCell>Test Name</TableHeaderCell>
                  <TableHeaderCell>Price Override</TableHeaderCell>
                  <TableHeaderCell>Added Date</TableHeaderCell>
                </TableHeader>
                <TableBody>
                  {pkg.tests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell>
                        <span className="font-medium text-gray-900">
                          {test.testName}
                        </span>
                      </TableCell>
                      <TableCell>
                        {test.testPrice ? (
                          <span className="text-sm font-medium text-gray-900">
                            ₹{test.testPrice.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {format(new Date(test.createdAt), 'MMM dd, yyyy')}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPackageValue > 0 && (
                <div className="mt-4 text-right">
                  <p className="text-sm text-gray-500">Total Test Value:</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ₹{totalPackageValue.toFixed(2)}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No tests associated with this package.</p>
              <Link href={`/packages/${pkg.id}/tests`} className="mt-4 inline-block">
                <Button variant="outline" size="sm">
                  Add Tests
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-6 mt-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Created</p>
              <p className="text-gray-900 mt-1">
                {format(new Date(pkg.createdAt), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Last Updated</p>
              <p className="text-gray-900 mt-1">
                {format(new Date(pkg.updatedAt), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href={`/packages/${pkg.id}/edit`}>
          <Button variant="primary">Edit Package</Button>
        </Link>
        <Link href={`/packages/${pkg.id}/tests`}>
          <Button variant="outline">Manage Tests</Button>
        </Link>
      </div>
    </div>
  );
};

