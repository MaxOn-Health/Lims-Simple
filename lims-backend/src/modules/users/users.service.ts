import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import { User } from './entities/user.entity';
import { QueryUsersDto } from './dto/query-users.dto';
import { PaginatedUsersResponseDto, PaginationMetaDto } from './dto/paginated-users-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

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

  async findAllPaginated(query: QueryUsersDto): Promise<PaginatedUsersResponseDto> {
    const { page = 1, limit = 10, role, search } = query;
    const skip = (page - 1) * limit;

    const where: FindManyOptions<User>['where'] = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.email = Like(`%${search}%`);
      // Note: TypeORM doesn't support OR conditions easily in where clause
      // We'll use a query builder for search
    }

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
}

