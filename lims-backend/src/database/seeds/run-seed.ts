import { DataSource } from 'typeorm';
import { createSuperAdmin } from './create-super-admin.seed';
import { config } from 'dotenv';
import { User } from '../../modules/users/entities/user.entity';

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USERNAME || process.env.USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'lims_db',
  entities: [User],
  synchronize: false,
  logging: true,
});

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

