import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';
import { QueryUsersDto } from './dto/query-users.dto';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockUser: User = {
    id: '123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    fullName: 'Test User',
    role: UserRole.DOCTOR,
    testTechnicianType: null,
    isActive: true,
    passkeyCredentialId: null,
    passkeyPublicKey: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should return a user when found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null when user not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user when found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);

      const result = await service.findById('123');

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '123' },
      });
    });

    it('should return null when user not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      const result = await service.findById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      jest.spyOn(service, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(mockUser);
      jest.spyOn(repository, 'save').mockResolvedValue(mockUser);

      const result = await service.create(mockUser);

      expect(result).toEqual(mockUser);
      expect(repository.create).toHaveBeenCalledWith(mockUser);
      expect(repository.save).toHaveBeenCalledWith(mockUser);
    });

    it('should throw ConflictException if email already exists', async () => {
      jest.spyOn(service, 'findByEmail').mockResolvedValue(mockUser);

      await expect(service.create(mockUser)).rejects.toThrow(ConflictException);
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateData = { fullName: 'Updated Name' };
      const updatedUser = { ...mockUser, ...updateData };

      jest.spyOn(service, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(service, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(repository, 'update').mockResolvedValue(undefined as any);
      jest.spyOn(service, 'findById').mockResolvedValue(updatedUser);

      const result = await service.update('123', updateData);

      expect(result).toEqual(updatedUser);
      expect(repository.update).toHaveBeenCalledWith('123', updateData);
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(null);

      await expect(service.update('invalid-id', {})).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should check email uniqueness when email is updated', async () => {
      const existingUser = { ...mockUser, email: 'existing@example.com' };
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(service, 'findByEmail').mockResolvedValue(existingUser);

      await expect(
        service.update('123', { email: 'existing@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should not check email uniqueness if email is not changed', async () => {
      const updateData = { email: mockUser.email };
      const findByEmailSpy = jest.spyOn(service, 'findByEmail');
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'update').mockResolvedValue(undefined as any);
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser);

      await service.update('123', updateData);

      expect(findByEmailSpy).not.toHaveBeenCalled();
    });
  });

  describe('findAllPaginated', () => {
    it('should return paginated users', async () => {
      const query: QueryUsersDto = { page: 1, limit: 10 };
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockUser], 1]),
      };

      jest
        .spyOn(repository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAllPaginated(query);

      expect(result.data).toHaveLength(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should filter by role', async () => {
      const query: QueryUsersDto = { page: 1, limit: 10, role: UserRole.DOCTOR };
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockUser], 1]),
      };

      jest
        .spyOn(repository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      await service.findAllPaginated(query);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('user.role = :role', {
        role: UserRole.DOCTOR,
      });
    });

    it('should search by email or name', async () => {
      const query: QueryUsersDto = { page: 1, limit: 10, search: 'test' };
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockUser], 1]),
      };

      jest
        .spyOn(repository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      await service.findAllPaginated(query);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(user.email ILIKE :search OR user.fullName ILIKE :search)',
        { search: '%test%' },
      );
    });

    it('should combine role filter and search', async () => {
      const query: QueryUsersDto = {
        page: 1,
        limit: 10,
        role: UserRole.DOCTOR,
        search: 'test',
      };
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockUser], 1]),
      };

      jest
        .spyOn(repository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      await service.findAllPaginated(query);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('user.role = :role', {
        role: UserRole.DOCTOR,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(user.email ILIKE :search OR user.fullName ILIKE :search)',
        { search: '%test%' },
      );
    });
  });

  describe('softDelete', () => {
    it('should soft delete a user', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'update').mockResolvedValue(undefined as any);

      await service.softDelete('123');

      expect(repository.update).toHaveBeenCalledWith('123', { isActive: false });
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(null);

      await expect(service.softDelete('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should change user password', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'update').mockResolvedValue(undefined as any);

      await service.changePassword('123', 'new-hashed-password');

      expect(repository.update).toHaveBeenCalledWith('123', {
        passwordHash: 'new-hashed-password',
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(null);

      await expect(
        service.changePassword('invalid-id', 'new-password'),
      ).rejects.toThrow(NotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });
});

