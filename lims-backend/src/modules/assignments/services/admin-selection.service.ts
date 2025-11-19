import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../users/entities/user.entity';
import { Assignment } from '../entities/assignment.entity';
import { AssignmentStatus } from '../constants/assignment-status.enum';

@Injectable()
export class AdminSelectionService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Assignment)
    private assignmentsRepository: Repository<Assignment>,
  ) {}

  async findAvailableAdmin(testAdminRole: string): Promise<User | null> {
    // Get all active users with role TEST_TECHNICIAN
    const testAdmins = await this.usersRepository.find({
      where: {
        role: UserRole.TEST_TECHNICIAN,
        isActive: true,
        testTechnicianType: testAdminRole,
      },
    });

    if (testAdmins.length === 0) {
      return null;
    }

    // Count current assignments (status != SUBMITTED) for each admin
    const adminAssignmentCounts = await Promise.all(
      testAdmins.map(async (admin) => {
        // Count non-submitted assignments
        const nonSubmittedCount = await this.assignmentsRepository
          .createQueryBuilder('assignment')
          .where('assignment.admin_id = :adminId', { adminId: admin.id })
          .andWhere('assignment.status != :status', { status: AssignmentStatus.SUBMITTED })
          .getCount();

        return {
          admin,
          assignmentCount: nonSubmittedCount,
        };
      }),
    );

    // Sort by assignment count (ascending), then by createdAt (ascending) for tie-breaking
    adminAssignmentCounts.sort((a, b) => {
      if (a.assignmentCount !== b.assignmentCount) {
        return a.assignmentCount - b.assignmentCount;
      }
      // If tie, select by creation date (oldest first)
      return a.admin.createdAt.getTime() - b.admin.createdAt.getTime();
    });

    return adminAssignmentCounts[0].admin;
  }
}

