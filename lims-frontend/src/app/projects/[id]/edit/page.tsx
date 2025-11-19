'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { projectsService } from '@/services/api/projects.service';
import { ProjectForm } from '@/components/projects/ProjectForm/ProjectForm';
import { Project } from '@/types/project.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/common/Skeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';

interface ProjectEditPageProps {
  params: {
    id: string;
  };
}

export default function ProjectEditPage({ params }: ProjectEditPageProps) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProject();
  }, [params.id]);

  const fetchProject = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await projectsService.getProjectById(params.id);
      setProject(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(getErrorMessage(apiError));
    } finally {
      setIsLoading(false);
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
      <div>
        <h1 className="text-2xl font-bold">Edit Project</h1>
        <p className="text-muted-foreground mt-1">
          Update project details and settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm project={project} mode="edit" onSuccess={() => router.push(`/projects/${project.id}`)} />
        </CardContent>
      </Card>
    </div>
  );
}

