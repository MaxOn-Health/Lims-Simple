import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Between } from 'typeorm';
import { Project } from './entities/project.entity';
import { Patient } from '../patients/entities/patient.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectsDto } from './dto/query-projects.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { ProjectStatus } from './constants/project-status.enum';
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
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
  ) { }

  async create(createProjectDto: CreateProjectDto): Promise<ProjectResponseDto> {
    // Check if project name already exists
    const existingProject = await this.projectsRepository.findOne({
      where: { name: createProjectDto.name },
    });

    if (existingProject) {
      throw new ConflictException('Project name already exists');
    }

    const project = this.projectsRepository.create({
      name: createProjectDto.name,
      description: createProjectDto.description,
      companyName: createProjectDto.companyName || null,
      contactPerson: createProjectDto.contactPerson || null,
      contactNumber: createProjectDto.contactNumber || null,
      contactEmail: createProjectDto.contactEmail || null,
      campDate: createProjectDto.campDate ? new Date(createProjectDto.campDate) : null,
      campLocation: createProjectDto.campLocation || null,
      campSettings: createProjectDto.campSettings || null,
      status: ProjectStatus.ACTIVE,
      notes: createProjectDto.notes || null,
      patientCount: 0,
      totalRevenue: 0,
    });

    const savedProject = await this.projectsRepository.save(project);
    return this.mapToResponseDto(savedProject);
  }

  async findAll(query: QueryProjectsDto): Promise<PaginatedProjectsResponse> {
    const { page = 1, limit = 10, search, status, companyName, campDateFrom, campDateTo } = query;
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

    // Camp date filter
    if (campDateFrom && campDateTo) {
      const fromDate = new Date(campDateFrom);
      const toDate = new Date(campDateTo);
      toDate.setHours(23, 59, 59, 999);

      if (search || status || companyName) {
        queryBuilder = queryBuilder.andWhere('project.campDate BETWEEN :campDateFrom AND :campDateTo', {
          campDateFrom: fromDate,
          campDateTo: toDate,
        });
      } else {
        queryBuilder = queryBuilder.where('project.campDate BETWEEN :campDateFrom AND :campDateTo', {
          campDateFrom: fromDate,
          campDateTo: toDate,
        });
      }
    } else if (campDateFrom) {
      if (search || status || companyName) {
        queryBuilder = queryBuilder.andWhere('project.campDate >= :campDateFrom', { campDateFrom });
      } else {
        queryBuilder = queryBuilder.where('project.campDate >= :campDateFrom', { campDateFrom });
      }
    } else if (campDateTo) {
      if (search || status || companyName) {
        queryBuilder = queryBuilder.andWhere('project.campDate <= :campDateTo', { campDateTo });
      } else {
        queryBuilder = queryBuilder.where('project.campDate <= :campDateTo', { campDateTo });
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
      relations: ['patients'],
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
    if (updateProjectDto.campDate !== undefined) {
      project.campDate = updateProjectDto.campDate ? new Date(updateProjectDto.campDate) : null;
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
      campDate: project.campDate,
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
}

