import { registerAs } from '@nestjs/config';
import { IsString, IsNumber, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class DatabaseConfig {
  @IsString()
  @ValidateIf((o) => o.DATABASE_HOST !== undefined)
  DATABASE_HOST: string;

  @Type(() => Number)
  @IsNumber()
  @ValidateIf((o) => o.DATABASE_PORT !== undefined)
  DATABASE_PORT: number;

  @IsString()
  @ValidateIf((o) => o.DATABASE_USERNAME !== undefined)
  DATABASE_USERNAME: string;

  @IsString()
  @ValidateIf((o) => o.DATABASE_PASSWORD !== undefined)
  DATABASE_PASSWORD: string;

  @IsString()
  @ValidateIf((o) => o.DATABASE_NAME !== undefined)
  DATABASE_NAME: string;
}

export default registerAs('database', () => {
  const config: any = {
    type: 'postgres' as const,
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    migrationsRun: false,
    migrationsTableName: 'migrations',
    extra: {
      max: 10,
      connectionTimeoutMillis: 2000,
    },
  };

  if (process.env.DATABASE_URL) {
    config.url = process.env.DATABASE_URL;
    // Add SSL configuration for Render PostgreSQL and other cloud databases
    config.ssl = {
      rejectUnauthorized: false,
    };

    // Ensure we handle the "sslmode=require" which might conflict
    if (config.url.includes('sslmode=require')) {
      // We can rely on the ssl config object instead, or change to no-verify
      // config.url = config.url.replace('sslmode=require', 'sslmode=no-verify');
    }
  } else {
    config.host = process.env.DATABASE_HOST || 'localhost';
    config.port = parseInt(process.env.DATABASE_PORT, 10) || 5432;
    config.username = process.env.DATABASE_USERNAME || 'postgres';
    config.password = process.env.DATABASE_PASSWORD || 'postgres';
    config.database = process.env.DATABASE_NAME || 'lims_db';
  }

  return config;
});
