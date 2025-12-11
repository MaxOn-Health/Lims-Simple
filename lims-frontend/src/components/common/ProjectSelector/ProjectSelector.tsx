'use client';

import React from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Project } from '@/types/project.types';
import { formatDateRange } from '@/utils/date-helpers';
import { Building2, Calendar, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectSelectorProps {
    selectedProjectId: string | null;
    onSelect: (projectId: string | null) => void;
    projects: Project[];
    showAllOption?: boolean;
    allOptionLabel?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    size?: 'sm' | 'default' | 'lg';
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
    selectedProjectId,
    onSelect,
    projects: projectsProp,
    showAllOption = true,
    allOptionLabel = 'All Projects',
    placeholder = 'Select a project',
    disabled = false,
    className,
    size = 'default',
}) => {
    // Ensure projects is always an array (defensive check)
    const projects = projectsProp ?? [];

    // Auto-select if only one project and no selection
    React.useEffect(() => {
        if (projects.length === 1 && !selectedProjectId && !showAllOption) {
            onSelect(projects[0].id);
        }
    }, [projects, selectedProjectId, showAllOption, onSelect]);

    // If only one project and no "all" option, show read-only
    if (projects.length === 1 && !showAllOption) {
        const project = projects[0];
        return (
            <div
                className={cn(
                    'flex items-center gap-2 px-3 py-2 border rounded-md bg-muted/50',
                    className
                )}
            >
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{project.name}</span>
            </div>
        );
    }

    // If no projects
    if (projects.length === 0) {
        return (
            <div
                className={cn(
                    'flex items-center gap-2 px-3 py-2 border rounded-md bg-muted/50 text-muted-foreground',
                    className
                )}
            >
                <Building2 className="h-4 w-4" />
                <span>No projects available</span>
            </div>
        );
    }

    const selectedProject = selectedProjectId
        ? projects.find((p) => p.id === selectedProjectId)
        : null;

    return (
        <Select
            value={selectedProjectId || 'all'}
            onValueChange={(value) => onSelect(value === 'all' ? null : value)}
            disabled={disabled}
        >
            <SelectTrigger
                className={cn(
                    size === 'sm' && 'h-8 text-sm',
                    size === 'lg' && 'h-12',
                    className
                )}
            >
                <SelectValue placeholder={placeholder}>
                    {selectedProject ? (
                        <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{selectedProject.name}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            <span>{allOptionLabel}</span>
                        </div>
                    )}
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {showAllOption && (
                    <SelectItem value="all" className="py-2">
                        <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{allOptionLabel}</span>
                        </div>
                    </SelectItem>
                )}
                {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id} className="py-2">
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{project.name}</span>
                                {project.companyName && (
                                    <Badge variant="secondary" className="text-xs">
                                        {project.companyName}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                {(project.startDate || project.endDate) && (
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {formatDateRange(project.startDate, project.endDate)}
                                    </span>
                                )}
                                {project.memberCount !== undefined && (
                                    <span className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        {project.memberCount}
                                    </span>
                                )}
                            </div>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};
