import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../users/entities/user.entity';
import { Assignment } from '../entities/assignment.entity';
import { AssignmentStatus } from '../constants/assignment-status.enum';
import { ProjectMember } from '../../projects/entities/project-member.entity';

@Injectable()
export class AdminSelectionService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Assignment)
        private assignmentsRepository: Repository<Assignment>,
        @InjectRepository(ProjectMember)
        private projectMembersRepository: Repository<ProjectMember>,
    ) { }

    /**
     * Find an available admin (TEST_TECHNICIAN) who can handle a specific test type.
     * Prioritizes users with the least active assignments.
     *
     * @param adminRole - The testTechnicianType required (e.g., 'eye_test', 'audiometry')
     * @param projectId - Optional project ID to scope the search to project members only
     * @returns The most available user, or null if none found
     */
    async findAvailableAdmin(
        adminRole: string,
        projectId?: string,
    ): Promise<User | null> {
        try {
            // Build base query for users
            let userIds: string[] | null = null;

            // If projectId is provided, get only users who are members of that project
            if (projectId) {
                const projectMembers = await this.projectMembersRepository.find({
                    where: { projectId },
                    select: ['userId'],
                });
                userIds = projectMembers.map((m) => m.userId);

                if (userIds.length === 0) {
                    // No members in this project
                    return null;
                }
            }

            // Get all active TEST_TECHNICIANS or LAB_TECHNICIANS with matching type
            const usersQuery = this.usersRepository
                .createQueryBuilder('user')
                .where('user.role IN (:...roles)', { roles: [UserRole.TEST_TECHNICIAN, UserRole.LAB_TECHNICIAN] })
                .andWhere('user.isActive = :isActive', { isActive: true })
                .andWhere('user.testTechnicianType = :adminRole', { adminRole });

            // Filter by project members if projectId is provided
            if (userIds && userIds.length > 0) {
                usersQuery.andWhere('user.id IN (:...userIds)', { userIds });
            }

            const eligibleUsers = await usersQuery.getMany();

            if (eligibleUsers.length === 0) {
                return null;
            }

            // For each user, count their active assignments (not yet submitted)
            const userWorkloads: { user: User; activeCount: number }[] = [];

            for (const user of eligibleUsers) {
                const activeCount = await this.assignmentsRepository.count({
                    where: {
                        adminId: user.id,
                        status: AssignmentStatus.ASSIGNED, // Only count ASSIGNED or IN_PROGRESS
                    },
                });

                const inProgressCount = await this.assignmentsRepository.count({
                    where: {
                        adminId: user.id,
                        status: AssignmentStatus.IN_PROGRESS,
                    },
                });

                userWorkloads.push({
                    user,
                    activeCount: activeCount + inProgressCount,
                });
            }

            // Sort by workload (ascending) and then by createdAt (oldest first for tie-breaking)
            userWorkloads.sort((a, b) => {
                if (a.activeCount !== b.activeCount) {
                    return a.activeCount - b.activeCount;
                }
                // Tie-breaker: prefer the user who was created earlier
                return a.user.createdAt.getTime() - b.user.createdAt.getTime();
            });

            return userWorkloads[0]?.user || null;
        } catch (error) {
            console.error('Error finding available admin:', error);
            return null;
        }
    }

    /**
     * Get all technicians of a specific type for a project.
     * Useful for manual assignment dropdowns.
     *
     * @param adminRole - The testTechnicianType required
     * @param projectId - Optional project ID to scope the search
     * @returns Array of available users with their current workload
     */
    async getAvailableTechnicians(
        adminRole: string,
        projectId?: string,
    ): Promise<{ user: User; activeAssignments: number }[]> {
        try {
            let userIds: string[] | null = null;

            if (projectId) {
                const projectMembers = await this.projectMembersRepository.find({
                    where: { projectId },
                    select: ['userId'],
                });
                userIds = projectMembers.map((m) => m.userId);

                if (userIds.length === 0) {
                    return [];
                }
            }

            const usersQuery = this.usersRepository
                .createQueryBuilder('user')
                .where('user.role IN (:...roles)', { roles: [UserRole.TEST_TECHNICIAN, UserRole.LAB_TECHNICIAN] })
                .andWhere('user.isActive = :isActive', { isActive: true })
                .andWhere('user.testTechnicianType = :adminRole', { adminRole });

            if (userIds && userIds.length > 0) {
                usersQuery.andWhere('user.id IN (:...userIds)', { userIds });
            }

            const eligibleUsers = await usersQuery.getMany();

            const result: { user: User; activeAssignments: number }[] = [];

            for (const user of eligibleUsers) {
                const activeCount = await this.assignmentsRepository.count({
                    where: [
                        { adminId: user.id, status: AssignmentStatus.ASSIGNED },
                        { adminId: user.id, status: AssignmentStatus.IN_PROGRESS },
                    ],
                });

                result.push({ user, activeAssignments: activeCount });
            }

            // Sort by workload
            result.sort((a, b) => a.activeAssignments - b.activeAssignments);

            return result;
        } catch (error) {
            console.error('Error getting available technicians:', error);
            return [];
        }
    }
}
