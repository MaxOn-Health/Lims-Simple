import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtTokenService } from './jwt.service';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

describe('JwtTokenService', () => {
  let service: JwtTokenService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtTokenService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, any> = {
                'app.jwt.secret': 'test-secret',
                'app.jwt.expiresIn': '15m',
                'app.jwt.refreshSecret': 'test-refresh-secret',
                'app.jwt.refreshExpiresIn': '7d',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<JwtTokenService>(JwtTokenService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAccessToken', () => {
    it('should generate an access token', async () => {
      const payload: JwtPayload = {
        userId: '123',
        email: 'test@example.com',
        role: 'SUPER_ADMIN',
      };
      const token = 'test-access-token';

      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(token);

      const result = await service.generateAccessToken(payload);

      expect(result).toBe(token);
      expect(jwtService.signAsync).toHaveBeenCalledWith(payload, {
        secret: 'test-secret',
        expiresIn: '15m',
      });
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token', async () => {
      const payload: JwtPayload = {
        userId: '123',
        email: 'test@example.com',
        role: 'SUPER_ADMIN',
      };
      const token = 'test-refresh-token';

      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(token);

      const result = await service.generateRefreshToken(payload);

      expect(result).toBe(token);
      expect(jwtService.signAsync).toHaveBeenCalledWith(payload, {
        secret: 'test-refresh-secret',
        expiresIn: '7d',
      });
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify an access token', async () => {
      const token = 'test-access-token';
      const payload: JwtPayload = {
        userId: '123',
        email: 'test@example.com',
        role: 'SUPER_ADMIN',
      };

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);

      const result = await service.verifyAccessToken(token);

      expect(result).toEqual(payload);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret: 'test-secret',
      });
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a refresh token', async () => {
      const token = 'test-refresh-token';
      const payload: JwtPayload = {
        userId: '123',
        email: 'test@example.com',
        role: 'SUPER_ADMIN',
      };

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);

      const result = await service.verifyRefreshToken(token);

      expect(result).toEqual(payload);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret: 'test-refresh-secret',
      });
    });
  });
});

