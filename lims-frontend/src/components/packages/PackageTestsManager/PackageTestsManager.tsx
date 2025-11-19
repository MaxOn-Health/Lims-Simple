'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { packagesService } from '@/services/api/packages.service';
import { testsService } from '@/services/api/tests.service';
import { PackageTest } from '@/types/package.types';
import { Test } from '@/types/test.types';
import { Button } from '@/components/common/Button';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage, transformError } from '@/utils/error-handler';
import { AddTestToPackageModal } from '../AddTestToPackageModal';
import { RemoveTestModal } from '../RemoveTestModal';
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/common/Table/Table';
import { PageLoader } from '@/components/common/Loading';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { SearchInput } from '@/components/common/SearchInput';
import { useDebounce } from '@/hooks/useDebounce';

export const PackageTestsManager: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useUIStore();
  const packageId = params.id as string;

  const [packageTests, setPackageTests] = useState<PackageTest[]>([]);
  const [availableTests, setAvailableTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [testToRemove, setTestToRemove] = useState<PackageTest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchPackageTests = async () => {
    try {
      const data = await packagesService.getPackageTests(packageId);
      setPackageTests(data);
    } catch (err) {
      const apiError = transformError(err);
      addToast({
        type: 'error',
        message: getErrorMessage(apiError),
      });
    }
  };

  const fetchAvailableTests = async () => {
    try {
      const allTests = await testsService.getTests({ isActive: true });
      const testIdsInPackage = new Set(packageTests.map((pt) => pt.testId));
      const available = allTests.filter((test) => !testIdsInPackage.has(test.id));
      setAvailableTests(available);
    } catch (err) {
      const apiError = transformError(err);
      addToast({
        type: 'error',
        message: getErrorMessage(apiError),
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await fetchPackageTests();
        await fetchAvailableTests();
      } catch (err) {
        const apiError = transformError(err);
        setError(getErrorMessage(apiError));
      } finally {
        setIsLoading(false);
      }
    };

    if (packageId) {
      fetchData();
    }
  }, [packageId]);

  useEffect(() => {
    if (packageTests.length >= 0) {
      fetchAvailableTests();
    }
  }, [packageTests]);

  const handleAddTest = async () => {
    await fetchPackageTests();
    await fetchAvailableTests();
    setIsAddModalOpen(false);
    setSelectedTestId(null);
  };

  const handleAddClick = (testId?: string) => {
    setSelectedTestId(testId || null);
    setIsAddModalOpen(true);
  };

  const handleRemoveClick = (test: PackageTest) => {
    setTestToRemove(test);
    setIsRemoveModalOpen(true);
  };

  const handleRemoveConfirm = async () => {
    if (!testToRemove) return;

    try {
      await packagesService.removeTestFromPackage(packageId, testToRemove.testId);
      addToast({
        type: 'success',
        message: 'Test removed from package successfully',
      });
      await fetchPackageTests();
      setIsRemoveModalOpen(false);
      setTestToRemove(null);
    } catch (err) {
      const apiError = transformError(err);
      addToast({
        type: 'error',
        message: getErrorMessage(apiError),
      });
    }
  };

  const filteredAvailableTests = availableTests.filter((test) =>
    test.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  if (isLoading) {
    return <PageLoader />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => router.push('/packages')} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Package Tests</h1>
          <p className="mt-2 text-sm text-gray-600">
            Add or remove tests from this package
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Back to Package
        </Button>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Tests in Package ({packageTests.length})
          </h2>
        </div>

        {packageTests.length === 0 ? (
          <EmptyState
            title="No tests in package"
            message="Add tests to this package to get started."
            actionButton={
              <Button variant="primary" onClick={() => handleAddClick()}>
                Add Test
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableHeaderCell>Test Name</TableHeaderCell>
              <TableHeaderCell>Price Override</TableHeaderCell>
              <TableHeaderCell>Added Date</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableHeader>
            <TableBody>
              {packageTests.map((test) => (
                <TableRow key={test.id}>
                  <TableCell>
                    <span className="font-medium text-gray-900">{test.testName}</span>
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
                  <TableCell>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveClick(test)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Available Tests ({filteredAvailableTests.length})
          </h2>
          <Button variant="primary" onClick={() => handleAddClick()}>
            Add Test to Package
          </Button>
        </div>

        <div className="mb-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search available tests..."
          />
        </div>

        {filteredAvailableTests.length === 0 ? (
          <EmptyState
            title="No available tests"
            message={
              searchQuery
                ? 'No tests match your search criteria.'
                : 'All tests are already in this package.'
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableHeaderCell>Test Name</TableHeaderCell>
              <TableHeaderCell>Category</TableHeaderCell>
              <TableHeaderCell>Admin Role</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableHeader>
            <TableBody>
              {filteredAvailableTests.map((test) => (
                <TableRow key={test.id}>
                  <TableCell>
                    <span className="font-medium text-gray-900">{test.name}</span>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddClick(test.id)}
                    >
                      Add
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <AddTestToPackageModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedTestId(null);
        }}
        onSuccess={handleAddTest}
        packageId={packageId}
        availableTests={filteredAvailableTests}
        preselectedTestId={selectedTestId}
      />

      <RemoveTestModal
        isOpen={isRemoveModalOpen}
        onClose={() => {
          setIsRemoveModalOpen(false);
          setTestToRemove(null);
        }}
        onConfirm={handleRemoveConfirm}
        testName={testToRemove?.testName || ''}
      />
    </div>
  );
};

