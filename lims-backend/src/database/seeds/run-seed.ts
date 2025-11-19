import { DataSource } from 'typeorm';
import { createSuperAdmin } from './create-super-admin.seed';
import { config } from 'dotenv';
import { User } from '../../modules/users/entities/user.entity';

config();

const dataSourceOptions: any = {
  type: 'postgres',
  entities: [User],
  synchronize: false,
  logging: true,
};

if (process.env.DATABASE_URL) {
  dataSourceOptions.url = process.env.DATABASE_URL;
  dataSourceOptions.ssl = {
    rejectUnauthorized: false,
  };
} else {
  dataSourceOptions.host = process.env.DATABASE_HOST || 'localhost';
  dataSourceOptions.port = parseInt(process.env.DATABASE_PORT, 10) || 5432;
  dataSourceOptions.username = process.env.DATABASE_USERNAME || process.env.USER || 'postgres';
  dataSourceOptions.password = process.env.DATABASE_PASSWORD || '';
  dataSourceOptions.database = process.env.DATABASE_NAME || 'lims_db';
}

const dataSource = new DataSource(dataSourceOptions);

async function runSeed() {
  try {
    await dataSource.initialize();
    console.log('Database connection established');

    await createSuperAdmin(dataSource);

    await dataSource.destroy();
    console.log('Seed completed');
  } catch (error) {
    console.error('Error running seed:', error);
    process.exit(1);
  }
}

runSeed();

