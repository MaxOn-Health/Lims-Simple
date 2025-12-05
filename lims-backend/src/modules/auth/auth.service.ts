import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../users/users.service';
import { PasswordService } from '../../common/services/password.service';
import { JwtTokenService } from '../../common/services/jwt.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // In-memory storage for password reset tokens (use Redis in production)
  private passwordResetTokens = new Map<string, { userId: string; expiresAt: Date }>();

  constructor(
    private usersService: UsersService,
    private passwordService: PasswordService,
    private jwtTokenService: JwtTokenService,
  ) { }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const isPasswordValid = await this.passwordService.comparePassword(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtTokenService.generateAccessToken(payload);
    const refreshToken =
      await this.jwtTokenService.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    try {
      const payload = await this.jwtTokenService.verifyRefreshToken(
        refreshTokenDto.refreshToken,
      );

      const user = await this.usersService.findById(payload.userId);

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid token');
      }

      // Blacklist old refresh token (token rotation)
      const decoded = this.jwtTokenService.decodeToken(refreshTokenDto.refreshToken);
      if (decoded && decoded.exp) {
        const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
        if (expiresIn > 0) {
          await this.jwtTokenService.blacklistToken(refreshTokenDto.refreshToken, expiresIn);
        }
      }

      const newPayload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken =
        await this.jwtTokenService.generateAccessToken(newPayload);
      const refreshToken =
        await this.jwtTokenService.generateRefreshToken(newPayload);

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          isActive: user.isActive,
        },
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(token?: string): Promise<{ message: string }> {
    // Blacklist the token if provided
    if (token) {
      const decoded = this.jwtTokenService.decodeToken(token);
      if (decoded && decoded.exp) {
        const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
        if (expiresIn > 0) {
          await this.jwtTokenService.blacklistToken(token, expiresIn);
        }
      }
    }

    return { message: 'Logged out successfully' };
  }

  async getCurrentUser(userId: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Exclude passwordHash from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) {
      this.logger.warn(`Password reset requested for non-existent email: ${email}`);
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    if (!user.isActive) {
      this.logger.warn(`Password reset requested for inactive user: ${email}`);
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    // Generate reset token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token
    this.passwordResetTokens.set(token, {
      userId: user.id,
      expiresAt,
    });

    // Log token (in production, send via email)
    this.logger.log(`Password reset token for ${email}: ${token}`);
    this.logger.log(`Reset URL: /reset-password?token=${token}`);

    // Clean up expired tokens periodically
    this.cleanupExpiredTokens();

    return { message: 'If the email exists, a password reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const tokenData = this.passwordResetTokens.get(token);

    if (!tokenData) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (new Date() > tokenData.expiresAt) {
      this.passwordResetTokens.delete(token);
      throw new BadRequestException('Reset token has expired');
    }

    const user = await this.usersService.findById(tokenData.userId);

    if (!user) {
      this.passwordResetTokens.delete(token);
      throw new BadRequestException('User not found');
    }

    // Hash and update password
    const passwordHash = await this.passwordService.hashPassword(newPassword);
    await this.usersService.changePassword(tokenData.userId, passwordHash);

    // Invalidate token
    this.passwordResetTokens.delete(token);

    this.logger.log(`Password reset successful for user: ${user.email}`);

    return { message: 'Password has been reset successfully' };
  }

  private cleanupExpiredTokens(): void {
    const now = new Date();
    for (const [token, data] of this.passwordResetTokens.entries()) {
      if (now > data.expiresAt) {
        this.passwordResetTokens.delete(token);
      }
    }
  }
}

