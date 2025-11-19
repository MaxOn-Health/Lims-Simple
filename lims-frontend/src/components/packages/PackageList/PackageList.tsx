'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { packagesService } from '@/services/api/packages.service';
import { DeletePackageModal } from '../DeletePackageModal';
import { Package } from '@/types/package.types';
import { PackageSearch } from '../PackageSearch';
import { PackageFilters } from '../PackageFilters';
import { PackageCard } from '../PackageCard';
import { PackageTable } from '../PackageTable';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { Button } from '@/components/common/Button';
import { useDebounce } from '@/hooks/useDebounce';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage, transformError } from '@/utils/error-handler';
import { HasRole } from '@/components/common/HasRole';
import { UserRole } from '@/types/user.types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Plus, Grid3x3, Table2, Package as PackageIcon } from 'lucide-react';

type ViewMode = 'grid' | 'table';

export const PackageList: React.FC = () => {
  const { addToast } = useUIStore();
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<Package | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchPackages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const query: any = {};
      if (isActiveFilter !== undefined) {
        query.isActive = isActiveFilter;
      }
      const data = await packagesService.getPackages(query);
      setPackages(data);
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
    fetchPackages();
  }, [isActiveFilter]);

  const filteredPackages = useMemo(() => {
    if (!debouncedSearch) return packages;
    return packages.filter((pkg) =>
      pkg.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [packages, debouncedSearch]);

  const handleResetFilters = () => {
    setIsActiveFilter(undefined);
    setSearchQuery('');
  };

  const handleDeleteClick = (pkg: Package) => {
    setPackageToDelete(pkg);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!packageToDelete) return;

    setIsDeleting(true);
    try {
      await packagesService.deletePackage(packageToDelete.id);
      addToast({
        type: 'success',
        message: `Package ${packageToDelete.name} deleted successfully`,
      });
      await fetchPackages();
      setDeleteModalOpen(false);
      setPackageToDelete(null);
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
            <PackageIcon className="h-8 w-8 text-primary" />
            Packages
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage test packages and their associated tests
          </p>
        </div>
        <HasRole allowedRoles={[UserRole.SUPER_ADMIN]}>
          <Link href="/packages/new">
            <Button variant="primary" size="default">
              <Plus className="mr-2 h-4 w-4" />
              Create New Package
            </Button>
          </Link>
        </HasRole>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <PackageSearch value={searchQuery} onChange={setSearchQuery} />
            </div>
            <div className="flex items-end gap-4">
              <PackageFilters
                isActiveFilter={isActiveFilter}
                onIsActiveFilterChange={setIsActiveFilter}
                onReset={handleResetFilters}
              />
              <div className="space-y-2">
                <Label htmlFor="view-mode" className="text-sm font-medium">
                  View
                </Label>
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                  <TabsList>
                    <TabsTrigger value="grid" className="gap-2">
                      <Grid3x3 className="h-4 w-4" />
                      Grid
                    </TabsTrigger>
                    <TabsTrigger value="table" className="gap-2">
                      <Table2 className="h-4 w-4" />
                      Table
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-3">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-lg border border-border p-6">
                      <Skeleton height="h-6" className="mb-4" />
                      <Skeleton height="h-4" className="mb-2" />
                      <Skeleton height="h-4" className="mb-4" />
                      <Skeleton height="h-8" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <Skeleton height="h-10" />
                  <Skeleton height="h-10" />
                  <Skeleton height="h-10" />
                </div>
              )}
            </div>
          )}

          {error && <ErrorState message={error} onRetry={fetchPackages} />}

          {!isLoading && !error && filteredPackages.length === 0 && (
            <EmptyState
              title="No packages found"
              message={
                searchQuery || isActiveFilter !== undefined
                  ? 'No packages match your search criteria.'
                  : 'Get started by creating your first package.'
              }
              action={
                <HasRole allowedRoles={[UserRole.SUPER_ADMIN]}>
                  <Link href="/packages/new">
                    <Button variant="primary">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Package
                    </Button>
                  </Link>
                </HasRole>
              }
            />
          )}

          {!isLoading && !error && filteredPackages.length > 0 && (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPackages.map((pkg) => (
                    <PackageCard
                      key={pkg.id}
                      package={pkg}
                      onDelete={() => handleDeleteClick(pkg)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border">
                  <PackageTable packages={filteredPackages} onDelete={(id) => {
                    const pkg = filteredPackages.find(p => p.id === id);
                    if (pkg) handleDeleteClick(pkg);
                  }} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <DeletePackageModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setPackageToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        packageName={packageToDelete?.name || ''}
        isLoading={isDeleting}
      />
    </div>
  );
};

