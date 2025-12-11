import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminSelectionService } from './admin-selection.service';
import { User, UserRole } from '../../users/entities/user.entity';
import { Assignment } from '../entities/assignment.entity';
import { ProjectMember } from '../../projects/entities/project-member.entity';
import { AssignmentStatus } from '../constants/assignment-status.enum';

describe('AdminSelectionService', () => {
  let service: AdminSelectionService;
  let usersRepository: Repository<User>;
  let assignmentsRepository: Repository<Assignment>;

  const mockUser1: User = {
    id: 'admin-1',
    email: 'admin1@lims.com',
    passwordHash: 'hash',
    fullName: 'Admin One',
    role: UserRole.TEST_TECHNICIAN,
    testTechnicianType: 'audiometry',
    isActive: true,
    passkeyCredentialId: null,
    passkeyPublicKey: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  };

  const mockUser2: User = {
    id: 'admin-2',
    email: 'admin2@lims.com',
    passwordHash: 'hash',
    fullName: 'Admin Two',
    role: UserRole.TEST_TECHNICIAN,
    testTechnicianType: 'audiometry',
    isActive: true,
    passkeyCredentialId: null,
    passkeyPublicKey: null,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminSelectionService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([mockUser1, mockUser2]),
            })),
          },
        },
        {
          provide: getRepositoryToken(Assignment),
          useValue: {
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getCount: jest.fn(),
            })),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ProjectMember),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<AdminSelectionService>(AdminSelectionService);
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    assignmentsRepository = module.get<Repository<Assignment>>(getRepositoryToken(Assignment));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAvailableAdmin', () => {
    it('should return null if no admins available', async () => {
      jest.spyOn(usersRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      } as any);

      const result = await service.findAvailableAdmin('audiometry');

      expect(result).toBeNull();
    });

    it('should return admin with least assignments', async () => {
      jest.spyOn(usersRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockUser1, mockUser2]),
      } as any);
      // Mock count for admin-1: 2 ASSIGNED + 0 IN_PROGRESS = 2
      // Mock count for admin-2: 1 ASSIGNED + 0 IN_PROGRESS = 1
      jest.spyOn(assignmentsRepository, 'count')
        .mockResolvedValueOnce(2) // admin-1 ASSIGNED
        .mockResolvedValueOnce(0) // admin-1 IN_PROGRESS
        .mockResolvedValueOnce(1) // admin-2 ASSIGNED
        .mockResolvedValueOnce(0); // admin-2 IN_PROGRESS

      const result = await service.findAvailableAdmin('audiometry');

      expect(result).toEqual(mockUser2); // admin-2 has fewer assignments
    });

    it('should return oldest admin if tie in assignment count', async () => {
      jest.spyOn(usersRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockUser1, mockUser2]),
      } as any);
      // Both have 1 assignment (1 ASSIGNED + 0 IN_PROGRESS each)
      jest.spyOn(assignmentsRepository, 'count')
        .mockResolvedValueOnce(1) // admin-1 ASSIGNED
        .mockResolvedValueOnce(0) // admin-1 IN_PROGRESS
        .mockResolvedValueOnce(1) // admin-2 ASSIGNED
        .mockResolvedValueOnce(0); // admin-2 IN_PROGRESS

      const result = await service.findAvailableAdmin('audiometry');

      expect(result).toEqual(mockUser1); // admin-1 is older (created earlier)
    });

    it('should filter by testTechnicianType', async () => {
      await service.findAvailableAdmin('audiometry');

      expect(usersRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });
});

