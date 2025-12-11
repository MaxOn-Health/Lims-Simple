'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Project } from '@/types/project.types';
import { projectsService } from '@/services/api/projects.service';
import { useAuthStore } from '@/store/auth.store';
import { UserRole } from '@/types/user.types';

interface ProjectContextValue {
    // User's assigned projects
    userProjects: Project[];
    userProjectIds: string[];

    // Currently selected project for filtering
    selectedProjectId: string | null;
    selectedProject: Project | null;

    // Loading state
    isLoading: boolean;
    error: string | null;

    // Actions
    setSelectedProjectId: (projectId: string | null) => void;
    refreshUserProjects: () => Promise<void>;

    // Helper methods
    hasProjectAccess: (projectId: string) => boolean;
    isSuperAdmin: boolean;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated } = useAuthStore();
    const [userProjects, setUserProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

    // Fetch user's projects
    const fetchUserProjects = useCallback(async () => {
        if (!isAuthenticated || !user) {
            setUserProjects([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // SUPER_ADMIN can see all projects, others see only their assigned projects
            let projects: Project[];
            if (isSuperAdmin) {
                // Super admin can see all projects
                const response = await projectsService.getProjects({ limit: 100 });
                projects = response.data;
            } else {
                // Regular users see only their assigned projects
                // This calls the backend endpoint that filters by user membership
                projects = await projectsService.getMyProjects();
            }
            setUserProjects(projects);

            // Auto-select if only one project
            if (projects.length === 1 && !selectedProjectId) {
                setSelectedProjectId(projects[0].id);
            }
        } catch (err) {
            console.error('Failed to fetch user projects:', err);
            setError('Failed to load your projects');
            setUserProjects([]);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, user, isSuperAdmin, selectedProjectId]);

    // Fetch projects on auth change
    useEffect(() => {
        if (isAuthenticated) {
            fetchUserProjects();
        } else {
            setUserProjects([]);
            setSelectedProjectId(null);
        }
    }, [isAuthenticated, fetchUserProjects]);

    // Derived values
    const userProjectIds = userProjects.map((p) => p.id);
    const selectedProject = selectedProjectId
        ? userProjects.find((p) => p.id === selectedProjectId) || null
        : null;

    // Check if user has access to a specific project
    const hasProjectAccess = useCallback(
        (projectId: string): boolean => {
            if (isSuperAdmin) return true;
            return userProjectIds.includes(projectId);
        },
        [isSuperAdmin, userProjectIds]
    );

    const value: ProjectContextValue = {
        userProjects,
        userProjectIds,
        selectedProjectId,
        selectedProject,
        isLoading,
        error,
        setSelectedProjectId,
        refreshUserProjects: fetchUserProjects,
        hasProjectAccess,
        isSuperAdmin,
    };

    return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProject = (): ProjectContextValue => {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};

// Hook for checking project access
export const useProjectAccess = (projectId: string | null | undefined) => {
    const { hasProjectAccess, isSuperAdmin, isLoading } = useProject();

    if (!projectId) return { hasAccess: true, isLoading };

    return {
        hasAccess: isSuperAdmin || hasProjectAccess(projectId),
        isLoading,
    };
};
