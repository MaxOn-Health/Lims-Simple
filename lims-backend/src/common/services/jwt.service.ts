import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';
import { TokenBlacklistService } from './token-blacklist.service';

@Injectable()
export class JwtTokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {}

  async generateAccessToken(payload: JwtPayload): Promise<string> {
    const expiresIn = this.configService.get<string>('app.jwt.expiresIn') || '15m';
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('app.jwt.secret'),
      expiresIn: expiresIn as string,
    } as any);
  }

  async generateRefreshToken(payload: JwtPayload): Promise<string> {
    const expiresIn = this.configService.get<string>('app.jwt.refreshExpiresIn') || '7d';
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('app.jwt.refreshSecret'),
      expiresIn: expiresIn as string,
    } as any);
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    // Check if token is blacklisted
    if (this.tokenBlacklistService.isBlacklisted(token)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    return this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: this.configService.get<string>('app.jwt.secret'),
    });
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    // Check if token is blacklisted
    if (this.tokenBlacklistService.isBlacklisted(token)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    return this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: this.configService.get<string>('app.jwt.refreshSecret'),
    });
  }

  /**
   * Blacklist a token
   */
  async blacklistToken(token: string, expiresInSeconds: number): Promise<void> {
    this.tokenBlacklistService.addToBlacklist(token, expiresInSeconds);
  }

  /**
   * Decode token to get expiration time
   */
  decodeToken(token: string): { exp: number; iat: number } | null {
    try {
      return this.jwtService.decode(token) as { exp: number; iat: number } | null;
    } catch {
      return null;
    }
  }
}

