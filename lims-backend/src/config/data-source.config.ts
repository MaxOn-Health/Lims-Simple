import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

config();

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '../database/migrations/*{.ts,.js}')],
  migrationsTableName: 'migrations',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
};

if (process.env.DATABASE_URL) {
  Object.assign(dataSourceOptions, { url: process.env.DATABASE_URL });
} else {
  Object.assign(dataSourceOptions, {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    username: process.env.DATABASE_USERNAME || process.env.USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'lims_db',
  });
}

export default new DataSource(dataSourceOptions);

