import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { PasskeyService } from './services/passkey.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { User, UserRole } from '../users/entities/user.entity';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passkeyService: PasskeyService,
  ) {}

  @Post('login')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logged out successfully' },
      },
    },
  })
  async logout(@Req() request: Request): Promise<{ message: string }> {
    const authHeader = request.headers.authorization;
    const token = authHeader?.split(' ')[1]; // Extract Bearer token
    return this.authService.logout(token);
  }

  @Post('refresh')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({
    status: 200,
    description: 'Current user information',
    type: User,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@CurrentUser() user: JwtPayload): Promise<Omit<User, 'passwordHash'>> {
    return this.authService.getCurrentUser(user.userId);
  }

  @Post('setup-passkey')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate challenge for passkey setup (DOCTOR only)' })
  @ApiResponse({
    status: 200,
    description: 'Challenge generated successfully',
    schema: {
      type: 'object',
      properties: {
        challengeId: { type: 'string' },
        options: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - DOCTOR only' })
  async setupPasskey(@CurrentUser() user: JwtPayload) {
    const currentUser = await this.authService.getCurrentUser(user.userId);
    return this.passkeyService.generateChallenge(
      user.userId,
      currentUser.email,
      currentUser.fullName,
    );
  }

  @Post('verify-passkey-setup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify and store passkey credential (DOCTOR only)' })
  @ApiResponse({
    status: 200,
    description: 'Passkey setup verified and stored successfully',
    schema: {
      type: 'object',
      properties: {
        verified: { type: 'boolean' },
        credentialId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - verification failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - DOCTOR only' })
  async verifyPasskeySetup(
    @Body() body: { challengeId: string; credential: any; challenge: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.passkeyService.verifyPasskeySetup(
      user.userId,
      body.challengeId,
      body.credential,
      body.challenge,
    );
  }

  @Post('verify-passkey')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify passkey for signing (DOCTOR only)' })
  @ApiResponse({
    status: 200,
    description: 'Passkey verified successfully',
    schema: {
      type: 'object',
      properties: {
        verified: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - verification failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - DOCTOR only' })
  async verifyPasskey(
    @Body() body: { challengeId: string; credential: any; challenge: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.passkeyService.verifyPasskeyForSigning(
      user.userId,
      body.challengeId,
      body.credential,
      body.challenge,
    );
  }
}

