'use client';

import { useCallback } from 'react';
import { useProject } from '@/contexts/ProjectContext';

/**
 * Hook to add project filtering to data queries
 * Returns the project filter params and helper functions
 */
export const useProjectFilter = () => {
    const {
        selectedProjectId,
        userProjectIds,
        isSuperAdmin,
        userProjects,
        setSelectedProjectId,
        isLoading,
    } = useProject();

    /**
     * Get query params for API calls with project filtering
     */
    const getProjectQueryParams = useCallback((): { projectId?: string; projectIds?: string[] } => {
        // If a specific project is selected
        if (selectedProjectId) {
            return { projectId: selectedProjectId };
        }

        // Super admin sees everything, no filter needed
        if (isSuperAdmin) {
            return {};
        }

        // Regular user: filter by their project IDs
        if (userProjectIds.length > 0) {
            return { projectIds: userProjectIds };
        }

        // User has no projects - return empty array to show nothing
        return { projectIds: [] };
    }, [selectedProjectId, isSuperAdmin, userProjectIds]);

    /**
     * Check if filtering is needed (not super admin without selection)
     */
    const needsFiltering = !isSuperAdmin || selectedProjectId !== null;

    /**
     * Get selected project ID for single-project queries
     */
    const getSelectedProjectId = useCallback((): string | undefined => {
        if (selectedProjectId) return selectedProjectId;
        if (userProjects.length === 1) return userProjects[0].id;
        return undefined;
    }, [selectedProjectId, userProjects]);

    return {
        selectedProjectId,
        userProjectIds,
        userProjects,
        isSuperAdmin,
        isLoading,
        setSelectedProjectId,
        getProjectQueryParams,
        getSelectedProjectId,
        needsFiltering,
        hasProjects: userProjectIds.length > 0,
        hasMultipleProjects: userProjects.length > 1,
    };
};
