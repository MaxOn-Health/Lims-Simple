import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import databaseConfig from './config/database.config';
import appConfig from './config/app.config';
import { getThrottlerConfig } from './config/throttler.config';
import { HealthController } from './common/health.controller';
import { HealthService } from './common/services/health.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PackagesModule } from './modules/packages/packages.module';
import { TestsModule } from './modules/tests/tests.module';
import { PatientsModule } from './modules/patients/patients.module';
import { AuditModule } from './modules/audit/audit.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { ResultsModule } from './modules/results/results.module';
import { BloodSamplesModule } from './modules/blood-samples/blood-samples.module';
import { DoctorReviewsModule } from './modules/doctor-reviews/doctor-reviews.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AdminRolesModule } from './modules/admin-roles/admin-roles.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { JwtTokenService } from './common/services/jwt.service';
import { PasswordService } from './common/services/password.service';
import { Reflector } from '@nestjs/core';
import { AuditLoggingInterceptor } from './common/interceptors/audit-logging.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig],
      envFilePath: ['.env'],
    }),
    // Throttler Module for rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getThrottlerConfig,
      inject: [ConfigService],
    }),
    // JWT Module for global guard
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
    // Database module
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        const baseConfig = {
          type: 'postgres' as const,
          synchronize: false,
          logging: configService.get<string>('app.nodeEnv') === 'development',
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
          migrationsRun: false,
          migrationsTableName: 'migrations',
          extra: {
            max: 10,
            connectionTimeoutMillis: 2000,
          },
        };

        // If DATABASE_URL is provided, use url; otherwise use individual properties
        if (dbConfig?.url) {
          return {
            ...baseConfig,
            url: dbConfig.url,
            ssl: {
              rejectUnauthorized: false,
            },
          };
        }

        return {
          ...baseConfig,
          host: dbConfig?.host || 'localhost',
          port: dbConfig?.port || 5432,
          username: dbConfig?.username || 'postgres',
          password: dbConfig?.password || 'postgres',
          database: dbConfig?.database || 'lims_db',
          ssl: dbConfig?.host ? undefined : { rejectUnauthorized: false },
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    PackagesModule,
    TestsModule,
    PatientsModule,
    AuditModule,
    AssignmentsModule,
    ResultsModule,
    BloodSamplesModule,
    DoctorReviewsModule,
    ReportsModule,
    ProjectsModule,
    DashboardModule,
    AdminRolesModule,
  ],
  controllers: [HealthController],
  providers: [
    HealthService,
    PasswordService,
    {
      provide: APP_GUARD,
      useFactory: (jwtTokenService: JwtTokenService, reflector: Reflector) => {
        return new JwtAuthGuard(jwtTokenService, reflector);
      },
      inject: [JwtTokenService, Reflector],
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule { }
