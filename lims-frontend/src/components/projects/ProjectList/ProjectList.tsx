'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { projectsService } from '@/services/api/projects.service';
import { Project, QueryProjectsParams, ProjectStatus } from '@/types/project.types';
import { ProjectSearch } from '../ProjectSearch/ProjectSearch';
import { ProjectFilters } from '../ProjectFilters/ProjectFilters';
import { ProjectTable } from '../ProjectTable/ProjectTable';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { Button } from '@/components/common/Button';
import { useDebounce } from '@/hooks/useDebounce';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage, transformError } from '@/utils/error-handler';
import { HasRole } from '@/components/common/HasRole';
import { UserRole } from '@/types/user.types';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { Pagination } from '@/components/common/Pagination/Pagination';

export const ProjectList: React.FC = () => {
  const { addToast } = useUIStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | undefined>();
  const [companyNameFilter, setCompanyNameFilter] = useState<string | undefined>();
  const [campDateFrom, setCampDateFrom] = useState<string | undefined>();
  const [campDateTo, setCampDateTo] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const query: QueryProjectsParams = {
        page,
        limit,
      };

      if (debouncedSearch) {
        query.search = debouncedSearch;
      }

      if (statusFilter) {
        query.status = statusFilter;
      }

      if (companyNameFilter) {
        query.companyName = companyNameFilter;
      }

      if (campDateFrom) {
        query.campDateFrom = campDateFrom;
      }

      if (campDateTo) {
        query.campDateTo = campDateTo;
      }

      const response = await projectsService.getProjects(query);
      setProjects(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages);
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
    fetchProjects();
  }, [page, debouncedSearch, statusFilter, companyNameFilter, campDateFrom, campDateTo]);

  const handleResetFilters = () => {
    setStatusFilter(undefined);
    setCompanyNameFilter(undefined);
    setCampDateFrom(undefined);
    setCampDateTo(undefined);
    setSearchQuery('');
    setPage(1);
  };

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;

    setIsDeleting(true);
    try {
      await projectsService.deleteProject(projectToDelete.id);
      addToast({
        type: 'success',
        message: `Project ${projectToDelete.name} deleted successfully`,
      });
      await fetchProjects();
      setDeleteModalOpen(false);
      setProjectToDelete(null);
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

  if (error && !isLoading) {
    return (
      <ErrorState
        message={error}
        onRetry={fetchProjects}
        title="Failed to load projects"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage company health camps and projects</p>
        </div>
        <HasRole allowedRoles={[UserRole.SUPER_ADMIN]}>
          <Link href="/projects/new">
            <Button variant="primary">
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </Link>
        </HasRole>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <ProjectSearch value={searchQuery} onChange={setSearchQuery} />
            <ProjectFilters
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              companyNameFilter={companyNameFilter}
              onCompanyNameFilterChange={setCompanyNameFilter}
              campDateFrom={campDateFrom}
              onCampDateFromChange={setCampDateFrom}
              campDateTo={campDateTo}
              onCampDateToChange={setCampDateTo}
              onReset={handleResetFilters}
            />
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : projects.length === 0 ? (
            <EmptyState
              title="No projects found"
              description={
                searchQuery || statusFilter || companyNameFilter
                  ? 'Try adjusting your filters'
                  : 'Get started by creating a new project'
              }
              action={
                <HasRole allowedRoles={[UserRole.SUPER_ADMIN]}>
                  <Link href="/projects/new">
                    <Button variant="primary">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Project
                    </Button>
                  </Link>
                </HasRole>
              }
            />
          ) : (
            <>
              <ProjectTable
                projects={projects}
                onDelete={handleDeleteClick}
                isLoading={isLoading}
              />
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={total}
                    itemsPerPage={limit}
                    onPageChange={setPage}
                    onItemsPerPageChange={() => {}} // Limit change not needed for now
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && projectToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">Delete Project</h3>
              <p className="text-muted-foreground mb-4">
                Are you sure you want to delete &quot;{projectToDelete.name}&quot;? This action
                cannot be undone.
              </p>
              {projectToDelete.patientCount > 0 && (
                <p className="text-red-600 text-sm mb-4">
                  Warning: This project has {projectToDelete.patientCount} patients. Please remove
                  all patients first or change the project status.
                </p>
              )}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setProjectToDelete(null);
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  isLoading={isDeleting}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

