'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Project } from '@/types/project.types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/common/Button/Button';
import { Badge } from '@/components/ui/badge';
import { ProjectStatusBadge } from '../ProjectStatusBadge/ProjectStatusBadge';
import { HasRole } from '@/components/common/HasRole';
import { UserRole } from '@/types/user.types';
import { formatDateRange } from '@/utils/date-helpers';
import { Eye, Edit, Trash2, Users } from 'lucide-react';
import { IndianRupee } from 'lucide-react';

interface ProjectTableProps {
  projects: Project[];
  onDelete?: (projectId: string) => void;
  isLoading?: boolean;
}

export const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  onDelete,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-10 bg-muted rounded flex-1" />
              <div className="h-10 bg-muted rounded flex-1" />
              <div className="h-10 bg-muted rounded flex-1" />
              <div className="h-10 bg-muted rounded flex-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return null;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-semibold">Name</TableHead>
          <TableHead className="font-semibold">Company</TableHead>
          <TableHead className="font-semibold">Date Range</TableHead>
          <TableHead className="font-semibold">Location</TableHead>
          <TableHead className="font-semibold">Patients</TableHead>
          <TableHead className="font-semibold">Team</TableHead>
          <TableHead className="font-semibold">Revenue</TableHead>
          <TableHead className="font-semibold">Status</TableHead>
          <HasRole allowedRoles={[UserRole.SUPER_ADMIN]}>
            <TableHead className="font-semibold text-right">Actions</TableHead>
          </HasRole>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id} className="hover:bg-muted/50">
            <TableCell>
              <Link
                href={`/projects/${project.id}`}
                className="font-medium text-primary hover:underline"
              >
                {project.name}
              </Link>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">
                {project.companyName || '—'}
              </span>
            </TableCell>
            <TableCell>
              <span className="text-sm">
                {formatDateRange(project.startDate, project.endDate) || '—'}
              </span>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground line-clamp-1">
                {project.campLocation || '—'}
              </span>
            </TableCell>
            <TableCell>
              <span className="text-sm font-medium">{project.patientCount}</span>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm">{project.memberCount ?? '—'}</span>
              </div>
            </TableCell>
            <TableCell>
              <span className="text-sm font-medium flex items-center gap-1">
                <IndianRupee className="w-3 h-3" />
                {Number(project.totalRevenue).toFixed(2)}
              </span>
            </TableCell>
            <TableCell>
              <ProjectStatusBadge status={project.status} />
            </TableCell>
            <HasRole allowedRoles={[UserRole.SUPER_ADMIN]}>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Link href={`/projects/${project.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href={`/projects/${project.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete?.(project.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </HasRole>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
