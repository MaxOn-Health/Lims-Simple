import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PasswordService } from '../../common/services/password.service';
import { JwtTokenService } from '../../common/services/jwt.service';
import { User, UserRole } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let passwordService: PasswordService;
  let jwtTokenService: JwtTokenService;

  const mockUser: User = {
    id: '123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    fullName: 'Test User',
    role: UserRole.SUPER_ADMIN,
    testTechnicianType: null,
    isActive: true,
    pinHash: null,
    passkeyCredentialId: null,
    passkeyPublicKey: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: PasswordService,
          useValue: {
            comparePassword: jest.fn(),
          },
        },
        {
          provide: JwtTokenService,
          useValue: {
            generateAccessToken: jest.fn(),
            generateRefreshToken: jest.fn(),
            verifyRefreshToken: jest.fn(),
            decodeToken: jest.fn().mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 }),
            blacklistToken: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    passwordService = module.get<PasswordService>(PasswordService);
    jwtTokenService = module.get<JwtTokenService>(JwtTokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(passwordService, 'comparePassword').mockResolvedValue(true);
      jest
        .spyOn(jwtTokenService, 'generateAccessToken')
        .mockResolvedValue('access-token');
      jest
        .spyOn(jwtTokenService, 'generateRefreshToken')
        .mockResolvedValue('refresh-token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(passwordService, 'comparePassword').mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(inactiveUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: 'refresh-token',
    };

    it('should refresh token successfully', async () => {
      const payload = {
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      };

      jest
        .spyOn(jwtTokenService, 'verifyRefreshToken')
        .mockResolvedValue(payload);
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);
      jest
        .spyOn(jwtTokenService, 'generateAccessToken')
        .mockResolvedValue('new-access-token');
      jest
        .spyOn(jwtTokenService, 'generateRefreshToken')
        .mockResolvedValue('new-refresh-token');

      const result = await service.refreshToken(refreshTokenDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      jest
        .spyOn(jwtTokenService, 'verifyRefreshToken')
        .mockRejectedValue(new Error('Invalid token'));

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const result = await service.logout();
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user without passwordHash', async () => {
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);

      const result = await service.getCurrentUser(mockUser.id);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(result.fullName).toBe(mockUser.fullName);
      expect(result.role).toBe(mockUser.role);
    });

    it('should throw BadRequestException if user not found', async () => {
      jest.spyOn(usersService, 'findById').mockResolvedValue(null);

      await expect(service.getCurrentUser('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

