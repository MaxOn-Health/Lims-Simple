import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordResetToken } from './entities/password-reset-token.entity';
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

  constructor(
    private usersService: UsersService,
    private passwordService: PasswordService,
    private jwtTokenService: JwtTokenService,
    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepository: Repository<PasswordResetToken>,
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
      this.logger.warn(`Password reset requested for non-existent email`);
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    if (!user.isActive) {
      this.logger.warn(`Password reset requested for inactive user`);
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    // Generate reset token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in DB
    const resetToken = this.passwordResetTokenRepository.create({
      token,
      userId: user.id,
      expiresAt,
    });
    await this.passwordResetTokenRepository.save(resetToken);

    // TODO: Send email
    // this.emailService.sendPasswordResetEmail(user.email, token);

    // Log intent but NOT the token
    this.logger.log(`Password reset token generated for user: ${user.id}`);

    return { message: 'If the email exists, a password reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const tokenData = await this.passwordResetTokenRepository.findOne({
      where: { token },
    });

    if (!tokenData) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (new Date() > tokenData.expiresAt) {
      await this.passwordResetTokenRepository.delete({ id: tokenData.id });
      throw new BadRequestException('Reset token has expired');
    }

    const user = await this.usersService.findById(tokenData.userId);

    if (!user) {
      await this.passwordResetTokenRepository.delete({ id: tokenData.id });
      throw new BadRequestException('User not found');
    }

    // Hash and update password
    const passwordHash = await this.passwordService.hashPassword(newPassword);
    await this.usersService.changePassword(tokenData.userId, passwordHash);

    // Invalidate token (delete it)
    await this.passwordResetTokenRepository.delete({ id: tokenData.id });

    this.logger.log(`Password reset successful for user: ${user.id}`);

    return { message: 'Password has been reset successfully' };
  }

  async setupPin(userId: string, pin: string): Promise<{ message: string }> {
    if (!/^\d{4}$/.test(pin)) {
      throw new BadRequestException('PIN must be exactly 4 digits');
    }

    const pinHash = await this.passwordService.hashPassword(pin);
    await this.usersService.updatePin(userId, pinHash);

    return { message: 'PIN set successfully' };
  }

  async verifyPin(userId: string, pin: string): Promise<{ verified: boolean }> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.pinHash) {
      return { verified: false };
    }

    const isValid = await this.passwordService.comparePassword(pin, user.pinHash);
    return { verified: isValid };
  }
}

