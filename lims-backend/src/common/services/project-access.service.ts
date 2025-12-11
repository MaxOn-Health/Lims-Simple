import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember } from '../../modules/projects/entities/project-member.entity';
import { RoleInProject } from '../../modules/projects/constants/role-in-project.enum';
import { User, UserRole } from '../../modules/users/entities/user.entity';

@Injectable()
export class ProjectAccessService {
    constructor(
        @InjectRepository(ProjectMember)
        private projectMembersRepository: Repository<ProjectMember>,
    ) { }

    /**
     * Get all project IDs a user is a member of.
     * If user is SUPER_ADMIN or RECEPTIONIST (who sees all), returns empty array
     * but the caller needs to check role first usually.
     *
     * Recommendation: Callers should check role. If SUPER_ADMIN, they access all.
     * If not, call this.
     */
    async getUserProjectIds(userId: string, userRole: string): Promise<string[]> {
        if (userRole === UserRole.SUPER_ADMIN) {
            // SUPER_ADMIN has access to all, return empty to signify "no filter needed" or handle in caller
            // Ideally returning empty array here might be ambiguous.
            // Let's stick to returning IDs if they are member, but for SUPER_ADMIN we usually skip this check.
            return [];
        }

        const memberships = await this.projectMembersRepository.find({
            where: { userId },
            select: ['projectId'],
        });

        return memberships.map((m) => m.projectId);
    }

    /**
     * Check if specific user is member of specific project.
     * Returns true for SUPER_ADMIN automatically.
     */
    async canAccessProject(userId: string, projectId: string, userRole: string): Promise<boolean> {
        if (userRole === UserRole.SUPER_ADMIN) {
            return true;
        }

        const count = await this.projectMembersRepository.count({
            where: { userId, projectId },
        });

        return count > 0;
    }

    /**
     * Strictly check membership without role bypass (useful for specific logic)
     */
    async isUserInProject(userId: string, projectId: string): Promise<boolean> {
        const count = await this.projectMembersRepository.count({
            where: { userId, projectId },
        });

        return count > 0;
    }

    async getMemberRole(userId: string, projectId: string): Promise<RoleInProject | null> {
        const member = await this.projectMembersRepository.findOne({
            where: { userId, projectId },
            select: ['roleInProject'],
        });
        return member?.roleInProject || null;
    }

    /**
     * Get all user IDs that are members of a specific project.
     * Used for filtering technicians by project membership.
     */
    async getProjectMemberIds(projectId: string): Promise<string[]> {
        const memberships = await this.projectMembersRepository.find({
            where: { projectId },
            select: ['userId'],
        });

        return memberships.map((m) => m.userId);
    }
}
