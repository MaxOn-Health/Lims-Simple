'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { testsService } from '@/services/api/tests.service';
import { Test, TestCategory } from '@/types/test.types';
import { TestSearch } from '../TestSearch';
import { TestFilters } from '../TestFilters';
import { TestTable } from '../TestTable';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { Button } from '@/components/common/Button';
import { useDebounce } from '@/hooks/useDebounce';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage, transformError } from '@/utils/error-handler';
import { HasRole } from '@/components/common/HasRole';
import { UserRole } from '@/types/user.types';
import { DeleteTestModal } from '../DeleteTestModal';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plus, TestTube } from 'lucide-react';

export const TestList: React.FC = () => {
  const { addToast } = useUIStore();
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TestCategory | undefined>();
  const [adminRoleFilter, setAdminRoleFilter] = useState<string | undefined>();
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<Test | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchTests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const query: any = {};
      if (categoryFilter) {
        query.category = categoryFilter;
      }
      if (adminRoleFilter) {
        query.adminRole = adminRoleFilter;
      }
      if (isActiveFilter !== undefined) {
        query.isActive = isActiveFilter;
      }
      const data = await testsService.getTests(query);
      setTests(data);
    } catch (err) {
      const apiError = transformError(err);
      setError(getErrorMessage(apiError));
      addToast({
        type: 'error',
        message: getErrorMessage(apiError),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [categoryFilter, adminRoleFilter, isActiveFilter]);

  const filteredTests = useMemo(() => {
    if (!debouncedSearch) return tests;
    return tests.filter((test) =>
      test.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [tests, debouncedSearch]);

  const handleResetFilters = () => {
    setCategoryFilter(undefined);
    setAdminRoleFilter(undefined);
    setIsActiveFilter(undefined);
    setSearchQuery('');
  };

  const handleDeleteClick = (test: Test) => {
    setTestToDelete(test);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!testToDelete) return;

    setIsDeleting(true);
    try {
      await testsService.deleteTest(testToDelete.id);
      addToast({
        type: 'success',
        message: `Test ${testToDelete.name} deleted successfully`,
      });
      await fetchTests();
      setDeleteModalOpen(false);
      setTestToDelete(null);
    } catch (err) {
      const apiError = transformError(err);
      addToast({
        type: 'error',
        message: getErrorMessage(apiError),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TestTube className="h-8 w-8 text-primary" />
            Tests
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage laboratory tests and their configurations
          </p>
        </div>
        <HasRole allowedRoles={[UserRole.SUPER_ADMIN]}>
          <Link href="/tests/new">
            <Button variant="primary" size="default">
              <Plus className="mr-2 h-4 w-4" />
              Create Test
            </Button>
          </Link>
        </HasRole>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <TestSearch value={searchQuery} onChange={setSearchQuery} />
            </div>
            <TestFilters
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              adminRoleFilter={adminRoleFilter}
              onAdminRoleFilterChange={setAdminRoleFilter}
              isActiveFilter={isActiveFilter}
              onIsActiveFilterChange={setIsActiveFilter}
              onReset={handleResetFilters}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} height="h-12" />
              ))}
            </div>
          )}

          {error && <ErrorState message={error} onRetry={fetchTests} />}

          {!isLoading && !error && filteredTests.length === 0 && (
            <EmptyState
              title="No tests found"
              message={
                searchQuery ||
                categoryFilter !== undefined ||
                adminRoleFilter !== undefined ||
                isActiveFilter !== undefined
                  ? 'No tests match your search criteria.'
                  : 'Get started by creating your first test.'
              }
              action={
                <HasRole allowedRoles={[UserRole.SUPER_ADMIN]}>
                  <Link href="/tests/new">
                    <Button variant="primary">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Test
                    </Button>
                  </Link>
                </HasRole>
              }
            />
          )}

          {!isLoading && !error && filteredTests.length > 0 && (
            <div className="rounded-md border">
              <TestTable tests={filteredTests} onDelete={(id) => {
                const test = filteredTests.find(t => t.id === id);
                if (test) handleDeleteClick(test);
              }} />
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteTestModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setTestToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        testName={testToDelete?.name || ''}
        isLoading={isDeleting}
      />
    </div>
  );
};

