import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuditService } from '../audit/audit.service';
import { PasswordService } from '../../common/services/password.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { User, UserRole } from './entities/user.entity';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;
  let passwordService: PasswordService;

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

  const mockSuperAdmin: JwtPayload = {
    userId: 'admin-id',
    email: 'admin@example.com',
    role: UserRole.SUPER_ADMIN,
  };

  const mockCurrentUser: JwtPayload = {
    userId: '123',
    email: 'test@example.com',
    role: UserRole.DOCTOR,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findAllPaginated: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            changePassword: jest.fn(),
          },
        },
        {
          provide: PasswordService,
          useValue: {
            hashPassword: jest.fn(),
            comparePassword: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
    passwordService = module.get<PasswordService>(PasswordService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'new@example.com',
      password: 'SecurePass123!',
      fullName: 'New User',
      role: UserRole.RECEPTIONIST,
    };

    it('should create a new user', async () => {
      jest.spyOn(passwordService, 'hashPassword').mockResolvedValue('hashed-password');
      jest.spyOn(usersService, 'create').mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(result).not.toHaveProperty('passwordHash');
      expect(passwordService.hashPassword).toHaveBeenCalledWith(createUserDto.password);
      expect(usersService.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if test_technician_type is missing for TEST_TECHNICIAN role', async () => {
      const testAdminDto: CreateUserDto = {
        ...createUserDto,
        role: UserRole.TEST_TECHNICIAN,
      };

      await expect(controller.create(testAdminDto)).rejects.toThrow(BadRequestException);
    });

    it('should create TEST_TECHNICIAN with test_technician_type', async () => {
      const testAdminDto: CreateUserDto = {
        ...createUserDto,
        role: UserRole.TEST_TECHNICIAN,
        testTechnicianType: 'audiometry',
      };
      jest.spyOn(passwordService, 'hashPassword').mockResolvedValue('hashed-password');
      jest.spyOn(usersService, 'create').mockResolvedValue(mockUser);

      const result = await controller.create(testAdminDto);

      expect(result).not.toHaveProperty('passwordHash');
      expect(usersService.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const query: QueryUsersDto = { page: 1, limit: 10 };
      const paginatedResult = {
        data: [mockUser],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      jest.spyOn(usersService, 'findAllPaginated').mockResolvedValue(paginatedResult);

      const result = await controller.findAll(query, mockSuperAdmin);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).not.toHaveProperty('passwordHash');
      expect(result.meta).toEqual(paginatedResult.meta);
    });
  });

  describe('findOne', () => {
    it('should return user when SUPER_ADMIN accesses any user', async () => {
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);

      const result = await controller.findOne('123', mockSuperAdmin);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.id).toBe(mockUser.id);
    });

    it('should return user when accessing own profile', async () => {
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);

      const result = await controller.findOne('123', mockCurrentUser);

      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw ForbiddenException when user not found', async () => {
      jest.spyOn(usersService, 'findById').mockResolvedValue(null);

      await expect(controller.findOne('invalid-id', mockSuperAdmin)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      fullName: 'Updated Name',
    };

    it('should update user when SUPER_ADMIN', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(usersService, 'update').mockResolvedValue(updatedUser);

      const result = await controller.update('123', updateUserDto, mockSuperAdmin);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.fullName).toBe('Updated Name');
    });

    it('should update limited fields when non-SUPER_ADMIN updates own profile', async () => {
      const updateData: UpdateUserDto = {
        fullName: 'Updated Name',
        role: UserRole.SUPER_ADMIN, // Should be ignored
        isActive: false, // Should be ignored
      };
      const updatedUser = { ...mockUser, fullName: 'Updated Name' };
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(usersService, 'update').mockResolvedValue(updatedUser);

      const result = await controller.update('123', updateData, mockCurrentUser);

      expect(result).not.toHaveProperty('passwordHash');
      // Verify that restricted fields were removed
      expect(usersService.update).toHaveBeenCalledWith('123', { fullName: 'Updated Name' });
    });

    it('should throw BadRequestException if test_technician_type missing for TEST_TECHNICIAN role update', async () => {
      const updateData: UpdateUserDto = {
        role: UserRole.TEST_TECHNICIAN,
      };
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);

      await expect(
        controller.update('123', updateData, mockSuperAdmin),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should soft delete user', async () => {
      jest.spyOn(usersService, 'softDelete').mockResolvedValue(undefined);

      const result = await controller.remove('456', mockSuperAdmin);

      expect(result).toEqual({ message: 'User deleted successfully' });
      expect(usersService.softDelete).toHaveBeenCalledWith('456');
    });

    it('should throw BadRequestException when trying to delete own account', async () => {
      await expect(controller.remove('admin-id', mockSuperAdmin)).rejects.toThrow(
        BadRequestException,
      );
      expect(usersService.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: 'OldPass123!',
      newPassword: 'NewPass123!',
    };

    it('should change password when user changes own password', async () => {
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(passwordService, 'comparePassword').mockResolvedValue(true);
      jest.spyOn(passwordService, 'hashPassword').mockResolvedValue('new-hashed-password');
      jest.spyOn(usersService, 'changePassword').mockResolvedValue(undefined);

      const result = await controller.changePassword('123', changePasswordDto, mockCurrentUser);

      expect(result).toEqual({ message: 'Password changed successfully' });
      expect(passwordService.comparePassword).toHaveBeenCalledWith(
        changePasswordDto.currentPassword,
        mockUser.passwordHash,
      );
      expect(passwordService.hashPassword).toHaveBeenCalledWith(changePasswordDto.newPassword);
    });

    it('should change password when SUPER_ADMIN changes another user password', async () => {
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(passwordService, 'hashPassword').mockResolvedValue('new-hashed-password');
      jest.spyOn(usersService, 'changePassword').mockResolvedValue(undefined);

      const result = await controller.changePassword('456', changePasswordDto, mockSuperAdmin);

      expect(result).toEqual({ message: 'Password changed successfully' });
      // SUPER_ADMIN doesn't need to verify current password
      expect(passwordService.comparePassword).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid current password', async () => {
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(passwordService, 'comparePassword').mockResolvedValue(false);

      await expect(
        controller.changePassword('123', changePasswordDto, mockCurrentUser),
      ).rejects.toThrow(BadRequestException);
      expect(usersService.changePassword).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user not found', async () => {
      jest.spyOn(usersService, 'findById').mockResolvedValue(null);

      await expect(
        controller.changePassword('invalid-id', changePasswordDto, mockCurrentUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

