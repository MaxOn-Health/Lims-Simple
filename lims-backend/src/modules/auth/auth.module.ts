import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasskeyService } from './services/passkey.service';
import { UsersModule } from '../users/users.module';
import { User } from '../users/entities/user.entity';
import { PasswordService } from '../../common/services/password.service';
import { JwtTokenService } from '../../common/services/jwt.service';
import { TokenBlacklistService } from '../../common/services/token-blacklist.service';
import { PasswordResetToken } from './entities/password-reset-token.entity';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([User, PasswordResetToken]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const expiresIn = configService.get<string>('app.jwt.expiresIn') || '15m';
        return {
          secret: configService.get<string>('app.jwt.secret'),
          signOptions: {
            expiresIn,
          },
        } as any;
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasskeyService, PasswordService, JwtTokenService, TokenBlacklistService],
  exports: [AuthService, PasskeyService, JwtTokenService],
})
export class AuthModule { }

