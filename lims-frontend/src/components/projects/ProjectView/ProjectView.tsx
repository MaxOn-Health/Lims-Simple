'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { projectsService } from '@/services/api/projects.service';
import { Project, ProjectStatus } from '@/types/project.types';
import { ProjectStatusBadge } from '../ProjectStatusBadge/ProjectStatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/common/Button/Button';
import { Separator } from '@/components/ui/separator';
import { HasRole } from '@/components/common/HasRole';
import { UserRole } from '@/types/user.types';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { Skeleton } from '@/components/common/Skeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { Edit, Users, IndianRupee, Calendar, MapPin, Building2, Phone, Mail, User } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProjectViewProps {
  projectId: string;
}

export const ProjectView: React.FC<ProjectViewProps> = ({ projectId }) => {
  const { addToast } = useUIStore();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await projectsService.getProjectById(projectId);
      setProject(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(getErrorMessage(apiError));
      addToast({
        type: 'error',
        message: getErrorMessage(apiError),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (status: ProjectStatus) => {
    if (!project) return;

    setIsUpdatingStatus(true);
    try {
      await projectsService.updateProjectStatus(project.id, status);
      addToast({
        type: 'success',
        message: 'Project status updated successfully',
      });
      await fetchProject();
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError),
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  if (error || !project) {
    return (
      <ErrorState
        message={error || 'Project not found'}
        onRetry={fetchProject}
        title="Failed to load project"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground mt-1">{project.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <ProjectStatusBadge status={project.status} />
          <HasRole allowedRoles={[UserRole.SUPER_ADMIN]}>
            <Link href={`/projects/${project.id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          </HasRole>
        </div>
      </div>

      {/* Project Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Company</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{project.companyName || '—'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{project.patientCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{Number(project.totalRevenue).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Camp Information */}
        <Card>
          <CardHeader>
            <CardTitle>Camp Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.campDate && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Camp Date</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(project.campDate), 'MMMM dd, yyyy')}
                  </p>
                </div>
              </div>
            )}

            {project.campLocation && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{project.campLocation}</p>
                </div>
              </div>
            )}

            {!project.campDate && !project.campLocation && (
              <p className="text-sm text-muted-foreground">No camp information available</p>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.contactPerson && (
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Contact Person</p>
                  <p className="text-sm text-muted-foreground">{project.contactPerson}</p>
                </div>
              </div>
            )}

            {project.contactNumber && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Contact Number</p>
                  <p className="text-sm text-muted-foreground">{project.contactNumber}</p>
                </div>
              </div>
            )}

            {project.contactEmail && (
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <a
                    href={`mailto:${project.contactEmail}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {project.contactEmail}
                  </a>
                </div>
              </div>
            )}

            {!project.contactPerson && !project.contactNumber && !project.contactEmail && (
              <p className="text-sm text-muted-foreground">No contact information available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Camp Settings */}
      {project.campSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Camp Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Auto-generate Patient IDs</p>
                <p className="text-sm text-muted-foreground">
                  {project.campSettings.autoGeneratePatientIds ? 'Yes' : 'No'}
                </p>
              </div>

              {project.campSettings.patientIdPrefix && (
                <div>
                  <p className="text-sm font-medium">Patient ID Prefix</p>
                  <p className="text-sm text-muted-foreground">
                    {project.campSettings.patientIdPrefix}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium">Require Employee ID</p>
                <p className="text-sm text-muted-foreground">
                  {project.campSettings.requireEmployeeId ? 'Yes' : 'No'}
                </p>
              </div>

              {project.campSettings.defaultPackageId && (
                <div>
                  <p className="text-sm font-medium">Default Package</p>
                  <p className="text-sm text-muted-foreground">Configured</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {project.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Status Update (Super Admin only) */}
      <HasRole allowedRoles={[UserRole.SUPER_ADMIN]}>
        <Card>
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <label htmlFor="status-select" className="text-sm font-medium">
                Change Status:
              </label>
              <Select
                value={project.status}
                onValueChange={(value) => handleStatusUpdate(value as ProjectStatus)}
                disabled={isUpdatingStatus}
              >
                <SelectTrigger id="status-select" className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ProjectStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={ProjectStatus.SCHEDULED}>Scheduled</SelectItem>
                  <SelectItem value={ProjectStatus.COMPLETED}>Completed</SelectItem>
                  <SelectItem value={ProjectStatus.CANCELLED}>Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </HasRole>

      {/* Timestamps */}
      <Card>
        <CardHeader>
          <CardTitle>Timestamps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Created</p>
              <p className="text-muted-foreground">
                {format(new Date(project.createdAt), 'MMMM dd, yyyy HH:mm')}
              </p>
            </div>
            <div>
              <p className="font-medium">Last Updated</p>
              <p className="text-muted-foreground">
                {format(new Date(project.updatedAt), 'MMMM dd, yyyy HH:mm')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

