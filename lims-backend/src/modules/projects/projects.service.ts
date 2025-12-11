import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, SelectQueryBuilder, In } from 'typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../users/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectsDto } from './dto/query-projects.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { ProjectMemberResponseDto } from './dto/project-member-response.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { ProjectStatus } from './constants/project-status.enum';
import { RoleInProject } from './constants/role-in-project.enum';
import { PaginationMetaDto } from '../patients/dto/paginated-patients-response.dto';

export interface PaginatedProjectsResponse {
  data: ProjectResponseDto[];
  meta: PaginationMetaDto;
}

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private projectMembersRepository: Repository<ProjectMember>,
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  async create(createProjectDto: CreateProjectDto): Promise<ProjectResponseDto> {
    // Check if project name already exists
    const existingProject = await this.projectsRepository.findOne({
      where: { name: createProjectDto.name },
    });

    if (existingProject) {
      throw new ConflictException('Project name already exists');
    }

    // Validate date logic
    if (createProjectDto.startDate && createProjectDto.endDate) {
      const startDate = new Date(createProjectDto.startDate);
      const endDate = new Date(createProjectDto.endDate);
      if (endDate < startDate) {
        throw new BadRequestException('End date must be on or after start date');
      }
    }

    const project = this.projectsRepository.create({
      name: createProjectDto.name,
      description: createProjectDto.description,
      companyName: createProjectDto.companyName || null,
      contactPerson: createProjectDto.contactPerson || null,
      contactNumber: createProjectDto.contactNumber || null,
      contactEmail: createProjectDto.contactEmail || null,
      startDate: createProjectDto.startDate ? new Date(createProjectDto.startDate) : null,
      endDate: createProjectDto.endDate ? new Date(createProjectDto.endDate) : null,
      campLocation: createProjectDto.campLocation || null,
      campSettings: createProjectDto.campSettings || null,
      status: ProjectStatus.ACTIVE,
      notes: createProjectDto.notes || null,
      patientCount: 0,
      totalRevenue: 0,
    });

    const savedProject = await this.projectsRepository.save(project);

    // Add members if provided
    if (createProjectDto.memberIds && createProjectDto.memberIds.length > 0) {
      await this.addMultipleMembers(savedProject.id, createProjectDto.memberIds);
    }

    return this.mapToResponseDto(savedProject);
  }

  async findAll(query: QueryProjectsDto): Promise<PaginatedProjectsResponse> {
    const { page = 1, limit = 10, search, status, companyName, startDateFrom, startDateTo } = query;
    const skip = (page - 1) * limit;

    let queryBuilder: SelectQueryBuilder<Project> = this.projectsRepository
      .createQueryBuilder('project')
      .orderBy('project.createdAt', 'DESC');

    // Search filter
    if (search) {
      queryBuilder = queryBuilder.where(
        '(project.name ILIKE :search OR project.description ILIKE :search OR project.companyName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Status filter
    if (status) {
      if (search) {
        queryBuilder = queryBuilder.andWhere('project.status = :status', { status });
      } else {
        queryBuilder = queryBuilder.where('project.status = :status', { status });
      }
    }

    // Company name filter
    if (companyName) {
      if (search || status) {
        queryBuilder = queryBuilder.andWhere('project.companyName ILIKE :companyName', {
          companyName: `%${companyName}%`,
        });
      } else {
        queryBuilder = queryBuilder.where('project.companyName ILIKE :companyName', {
          companyName: `%${companyName}%`,
        });
      }
    }

    // Start date filter (renamed from campDateFrom/To)
    if (startDateFrom && startDateTo) {
      const fromDate = new Date(startDateFrom);
      const toDate = new Date(startDateTo);
      toDate.setHours(23, 59, 59, 999);

      if (search || status || companyName) {
        queryBuilder = queryBuilder.andWhere('project.startDate BETWEEN :startDateFrom AND :startDateTo', {
          startDateFrom: fromDate,
          startDateTo: toDate,
        });
      } else {
        queryBuilder = queryBuilder.where('project.startDate BETWEEN :startDateFrom AND :startDateTo', {
          startDateFrom: fromDate,
          startDateTo: toDate,
        });
      }
    } else if (startDateFrom) {
      if (search || status || companyName) {
        queryBuilder = queryBuilder.andWhere('project.startDate >= :startDateFrom', { startDateFrom });
      } else {
        queryBuilder = queryBuilder.where('project.startDate >= :startDateFrom', { startDateFrom });
      }
    } else if (startDateTo) {
      if (search || status || companyName) {
        queryBuilder = queryBuilder.andWhere('project.startDate <= :startDateTo', { startDateTo });
      } else {
        queryBuilder = queryBuilder.where('project.startDate <= :startDateTo', { startDateTo });
      }
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const projects = await queryBuilder.skip(skip).take(limit).getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      data: projects.map((project) => this.mapToResponseDto(project)),
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async findById(id: string): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: ['patients', 'members', 'members.user'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.mapToResponseDto(project);
  }

  async update(id: string, updateProjectDto: UpdateProjectDto): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.findOne({ where: { id } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check name uniqueness if name is being updated
    if (updateProjectDto.name && updateProjectDto.name !== project.name) {
      const existingProject = await this.projectsRepository.findOne({
        where: { name: updateProjectDto.name },
      });
      if (existingProject) {
        throw new ConflictException('Project name already exists');
      }
    }

    // Validate date logic
    const newStartDate = updateProjectDto.startDate ? new Date(updateProjectDto.startDate) : project.startDate;
    const newEndDate = updateProjectDto.endDate ? new Date(updateProjectDto.endDate) : project.endDate;
    if (newStartDate && newEndDate && newEndDate < newStartDate) {
      throw new BadRequestException('End date must be on or after start date');
    }

    // Update fields
    if (updateProjectDto.name !== undefined) {
      project.name = updateProjectDto.name;
    }
    if (updateProjectDto.description !== undefined) {
      project.description = updateProjectDto.description;
    }
    if (updateProjectDto.companyName !== undefined) {
      project.companyName = updateProjectDto.companyName || null;
    }
    if (updateProjectDto.contactPerson !== undefined) {
      project.contactPerson = updateProjectDto.contactPerson || null;
    }
    if (updateProjectDto.contactNumber !== undefined) {
      project.contactNumber = updateProjectDto.contactNumber || null;
    }
    if (updateProjectDto.contactEmail !== undefined) {
      project.contactEmail = updateProjectDto.contactEmail || null;
    }
    if (updateProjectDto.startDate !== undefined) {
      project.startDate = updateProjectDto.startDate ? new Date(updateProjectDto.startDate) : null;
    }
    if (updateProjectDto.endDate !== undefined) {
      project.endDate = updateProjectDto.endDate ? new Date(updateProjectDto.endDate) : null;
    }
    if (updateProjectDto.campLocation !== undefined) {
      project.campLocation = updateProjectDto.campLocation || null;
    }
    if (updateProjectDto.campSettings !== undefined) {
      project.campSettings = updateProjectDto.campSettings || null;
    }
    if (updateProjectDto.notes !== undefined) {
      project.notes = updateProjectDto.notes || null;
    }

    const updatedProject = await this.projectsRepository.save(project);

    // Handle member updates if provided
    if (updateProjectDto.memberIds !== undefined) {
      // Remove all existing members and add new ones
      await this.projectMembersRepository.delete({ projectId: id });
      if (updateProjectDto.memberIds.length > 0) {
        await this.addMultipleMembers(id, updateProjectDto.memberIds);
      }
    }

    return this.mapToResponseDto(updatedProject);
  }

  async delete(id: string): Promise<void> {
    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: ['patients'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if project has patients
    if (project.patients && project.patients.length > 0) {
      throw new BadRequestException(
        `Cannot delete project with ${project.patients.length} patients. Please remove all patients first or change project status.`,
      );
    }

    await this.projectsRepository.remove(project);
  }

  async updateStatus(id: string, status: ProjectStatus): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.findOne({ where: { id } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    project.status = status;
    const updatedProject = await this.projectsRepository.save(project);
    return this.mapToResponseDto(updatedProject);
  }

  async getActiveProjects(): Promise<ProjectResponseDto[]> {
    const projects = await this.projectsRepository.find({
      where: { status: ProjectStatus.ACTIVE },
      order: { name: 'ASC' },
    });

    return projects.map((project) => this.mapToResponseDto(project));
  }

  // ─────────────────────────────────────────────
  // Member Management Methods
  // ─────────────────────────────────────────────

  async addMember(projectId: string, dto: AddProjectMemberDto): Promise<ProjectMemberResponseDto> {
    const project = await this.projectsRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const user = await this.usersRepository.findOne({ where: { id: dto.userId, isActive: true } });
    if (!user) {
      throw new NotFoundException('User not found or inactive');
    }

    // Check if member already exists
    const existingMember = await this.projectMembersRepository.findOne({
      where: { projectId, userId: dto.userId },
    });
    if (existingMember) {
      throw new ConflictException('User is already a member of this project');
    }

    const member = this.projectMembersRepository.create({
      projectId,
      userId: dto.userId,
      roleInProject: dto.roleInProject || RoleInProject.MEMBER,
    });

    const savedMember = await this.projectMembersRepository.save(member);

    // Reload with user relation
    const memberWithUser = await this.projectMembersRepository.findOne({
      where: { id: savedMember.id },
      relations: ['user'],
    });

    return this.mapMemberToResponseDto(memberWithUser!);
  }

  async removeMember(projectId: string, userId: string): Promise<{ message: string }> {
    const member = await this.projectMembersRepository.findOne({
      where: { projectId, userId },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this project');
    }

    await this.projectMembersRepository.remove(member);
    return { message: 'Member removed successfully' };
  }

  async getProjectMembers(projectId: string): Promise<ProjectMemberResponseDto[]> {
    const project = await this.projectsRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const members = await this.projectMembersRepository.find({
      where: { projectId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    return members.map((member) => this.mapMemberToResponseDto(member));
  }

  async getProjectsForUser(userId: string): Promise<ProjectResponseDto[]> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const memberships = await this.projectMembersRepository.find({
      where: { userId },
      relations: ['project'],
    });

    return memberships
      .filter((m) => m.project && m.project.status === ProjectStatus.ACTIVE)
      .map((m) => this.mapToResponseDto(m.project));
  }

  // ─────────────────────────────────────────────
  // Helper Methods
  // ─────────────────────────────────────────────

  private async addMultipleMembers(projectId: string, userIds: string[]): Promise<void> {
    // Validate all users exist and are active
    const users = await this.usersRepository.find({
      where: { id: In(userIds), isActive: true },
    });

    if (users.length !== userIds.length) {
      const foundIds = users.map((u) => u.id);
      const missingIds = userIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(`Users not found or inactive: ${missingIds.join(', ')}`);
    }

    // Create member records
    const members = userIds.map((userId) =>
      this.projectMembersRepository.create({
        projectId,
        userId,
        roleInProject: RoleInProject.MEMBER,
      }),
    );

    await this.projectMembersRepository.save(members);
  }

  /**
   * Update project statistics (patient count and total revenue)
   * Called automatically when a patient is added/removed or payment is updated
   */
  async updateStatistics(projectId: string): Promise<void> {
    const project = await this.projectsRepository.findOne({ where: { id: projectId } });

    if (!project) {
      return;
    }

    // Count patients in this project
    const patientCount = await this.patientsRepository.count({
      where: { projectId },
    });

    // Calculate total revenue from patient packages
    const patientsWithPackages = await this.patientsRepository.find({
      where: { projectId },
      relations: ['patientPackages'],
    });

    let totalRevenue = 0;
    for (const patient of patientsWithPackages) {
      if (patient.patientPackages && patient.patientPackages.length > 0) {
        const latestPackage = patient.patientPackages[patient.patientPackages.length - 1];
        totalRevenue += parseFloat(latestPackage.totalPrice.toString());
      }
    }

    project.patientCount = patientCount;
    project.totalRevenue = totalRevenue;

    await this.projectsRepository.save(project);
  }

  private mapToResponseDto(project: Project): ProjectResponseDto {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      companyName: project.companyName,
      contactPerson: project.contactPerson,
      contactNumber: project.contactNumber,
      contactEmail: project.contactEmail,
      startDate: project.startDate,
      endDate: project.endDate,
      campLocation: project.campLocation,
      campSettings: project.campSettings,
      patientCount: project.patientCount,
      totalRevenue: project.totalRevenue,
      status: project.status,
      notes: project.notes,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  private mapMemberToResponseDto(member: ProjectMember): ProjectMemberResponseDto {
    return {
      id: member.id,
      userId: member.userId,
      userFullName: member.user?.fullName || '',
      userEmail: member.user?.email || '',
      userRole: member.user?.role || '',
      testTechnicianType: member.user?.testTechnicianType || null,
      roleInProject: member.roleInProject,
      createdAt: member.createdAt,
    };
  }
}
