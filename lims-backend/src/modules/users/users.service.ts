import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions, In } from 'typeorm';
import { User } from './entities/user.entity';
import { QueryUsersDto } from './dto/query-users.dto';
import { PaginatedUsersResponseDto, PaginationMetaDto } from './dto/paginated-users-response.dto';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { ProjectAccessService } from '../../common/services/project-access.service';
import { UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(ProjectMember)
    private projectMembersRepository: Repository<ProjectMember>,
    private projectAccessService: ProjectAccessService,
  ) { }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(userData: Partial<User>): Promise<User> {
    // Check if email already exists
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check email uniqueness if email is being updated
    if (userData.email && userData.email !== user.email) {
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    await this.usersRepository.update(id, userData);
    return this.findById(id);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findAllPaginated(query: QueryUsersDto, currentUserId?: string, currentUserRole?: UserRole): Promise<PaginatedUsersResponseDto> {
    const { page = 1, limit = 10, role, search } = query;
    const skip = (page - 1) * limit;

    let queryBuilder = this.usersRepository.createQueryBuilder('user');

    if (role) {
      queryBuilder = queryBuilder.where('user.role = :role', { role });
    }

    if (search) {
      if (role) {
        queryBuilder = queryBuilder.andWhere(
          '(user.email ILIKE :search OR user.fullName ILIKE :search)',
          { search: `%${search}%` },
        );
      } else {
        queryBuilder = queryBuilder.where(
          '(user.email ILIKE :search OR user.fullName ILIKE :search)',
          { search: `%${search}%` },
        );
      }
    }

    // Project filtering (if not SUPER_ADMIN and context provided)
    if (currentUserId && currentUserRole && currentUserRole !== UserRole.SUPER_ADMIN) {
      const allowedProjectIds = await this.projectAccessService.getUserProjectIds(currentUserId, currentUserRole);

      if (allowedProjectIds.length === 0) {
        return {
          data: [],
          meta: { page, limit, total: 0, totalPages: 0 },
        };
      }

      // Find users who are members of these projects
      const projectMembers = await this.projectMembersRepository.find({
        where: { projectId: In(allowedProjectIds) },
        select: ['userId'],
      });

      const allowedUserIds = projectMembers.map(pm => pm.userId);

      // Also include self
      if (!allowedUserIds.includes(currentUserId)) {
        allowedUserIds.push(currentUserId);
      }

      if (allowedUserIds && allowedUserIds.length > 0) {
        queryBuilder = queryBuilder.andWhere('user.id IN (:...allowedUserIds)', { allowedUserIds });
      } else {
        return {
          data: [],
          meta: { page, limit, total: 0, totalPages: 0 },
        };
      }
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('user.createdAt', 'DESC')
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    const meta: PaginationMetaDto = {
      page,
      limit,
      total,
      totalPages,
    };

    return {
      data,
      meta,
    };
  }

  async softDelete(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepository.update(id, { isActive: false });
  }

  async changePassword(id: string, passwordHash: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepository.update(id, { passwordHash });
  }

  async updatePin(id: string, pinHash: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.usersRepository.update(id, { pinHash });
  }
}

