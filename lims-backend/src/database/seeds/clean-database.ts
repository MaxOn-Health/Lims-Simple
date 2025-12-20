import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';
import { User } from '../../modules/users/entities/user.entity';
import { Report } from '../../modules/reports/entities/report.entity';
import { DoctorReview } from '../../modules/doctor-reviews/entities/doctor-review.entity';
import { BloodSampleAccess } from '../../modules/blood-samples/entities/blood-sample-access.entity';
import { BloodSample } from '../../modules/blood-samples/entities/blood-sample.entity';
import { TestResult } from '../../modules/results/entities/test-result.entity';
import { Assignment } from '../../modules/assignments/entities/assignment.entity';
import { PatientPackage } from '../../modules/patients/entities/patient-package.entity';
import { Patient } from '../../modules/patients/entities/patient.entity';
import { PackageTest } from '../../modules/packages/entities/package-test.entity';
import { Test } from '../../modules/tests/entities/test.entity';
import { Package } from '../../modules/packages/entities/package.entity';
import { Project } from '../../modules/projects/entities/project.entity';
import { AuditLog } from '../../modules/audit/entities/audit-log.entity';

config();

const dataSourceOptions: any = {
  type: 'postgres',
  entities: [path.join(__dirname, '../../**/*.entity{.ts,.js}')],
  synchronize: false,
  logging: false,
};

if (process.env.DATABASE_URL) {
  dataSourceOptions.url = process.env.DATABASE_URL;
  dataSourceOptions.ssl = {
    rejectUnauthorized: false, // For Supabase/Render
  };
} else {
  dataSourceOptions.host = process.env.DATABASE_HOST || 'localhost';
  dataSourceOptions.port = parseInt(process.env.DATABASE_PORT, 10) || 5432;
  dataSourceOptions.username = process.env.DATABASE_USERNAME || process.env.USER || 'postgres';
  dataSourceOptions.password = process.env.DATABASE_PASSWORD || '';
  dataSourceOptions.database = process.env.DATABASE_NAME || 'lims_db';
}

const dataSource = new DataSource(dataSourceOptions);

async function cleanDatabase() {
  try {
    await dataSource.initialize();
    console.log('Database connection established');

    // Find super admin user
    const userRepository = dataSource.getRepository(User);
    const superAdmin = await userRepository.findOne({
      where: { email: 'admin@lims.com' },
    });

    if (!superAdmin) {
      console.error('Super admin user not found! Aborting cleanup to prevent data loss.');
      await dataSource.destroy();
      process.exit(1);
    }

    const superAdminId = superAdmin.id;
    console.log(`Found super admin user: ${superAdmin.email} (ID: ${superAdminId})`);

    console.log('\n=== Cleaning Database ===\n');

    // Delete in order to respect foreign key constraints (child tables first)

    console.log('Deleting reports...');
    await dataSource.getRepository(Report).createQueryBuilder().delete().execute();
    console.log('✓ Reports deleted');

    console.log('Deleting doctor reviews...');
    await dataSource.getRepository(DoctorReview).createQueryBuilder().delete().execute();
    console.log('✓ Doctor reviews deleted');

    console.log('Deleting blood sample access records...');
    await dataSource.getRepository(BloodSampleAccess).createQueryBuilder().delete().execute();
    console.log('✓ Blood sample access records deleted');

    console.log('Deleting blood samples...');
    await dataSource.getRepository(BloodSample).createQueryBuilder().delete().execute();
    console.log('✓ Blood samples deleted');

    console.log('Deleting test results...');
    await dataSource.getRepository(TestResult).createQueryBuilder().delete().execute();
    console.log('✓ Test results deleted');

    console.log('Deleting assignments...');
    await dataSource.getRepository(Assignment).createQueryBuilder().delete().execute();
    console.log('✓ Assignments deleted');

    console.log('Deleting patient packages...');
    await dataSource.getRepository(PatientPackage).createQueryBuilder().delete().execute();
    console.log('✓ Patient packages deleted');

    console.log('Deleting patients...');
    await dataSource.getRepository(Patient).createQueryBuilder().delete().execute();
    console.log('✓ Patients deleted');

    console.log('Deleting package tests...');
    await dataSource.getRepository(PackageTest).createQueryBuilder().delete().execute();
    console.log('✓ Package tests deleted');

    console.log('Deleting tests...');
    await dataSource.getRepository(Test).createQueryBuilder().delete().execute();
    console.log('✓ Tests deleted');

    console.log('Deleting packages...');
    await dataSource.getRepository(Package).createQueryBuilder().delete().execute();
    console.log('✓ Packages deleted');

    console.log('Deleting projects...');
    await dataSource.getRepository(Project).createQueryBuilder().delete().execute();
    console.log('✓ Projects deleted');

    console.log('Deleting audit logs...');
    await dataSource.getRepository(AuditLog).createQueryBuilder().delete().execute();
    console.log('✓ Audit logs deleted');

    console.log('Deleting users (except super admin)...');
    const deletedCount = await userRepository
      .createQueryBuilder()
      .delete()
      .where('id != :superAdminId', { superAdminId })
      .execute();
    console.log(`✓ ${deletedCount.affected || 0} users deleted (except super admin)`);

    // Verify super admin still exists and ensure it's active
    let verifySuperAdmin = await userRepository.findOne({
      where: { email: 'admin@lims.com' },
    });

    if (!verifySuperAdmin) {
      console.error('\n❌ ERROR: Super admin user was deleted! This should not happen.');
      await dataSource.destroy();
      process.exit(1);
    }

    // Ensure super admin is active (always set to true, regardless of current state)
    if (!verifySuperAdmin.isActive) {
      console.log('Activating super admin user...');
      verifySuperAdmin.isActive = true;
      verifySuperAdmin = await userRepository.save(verifySuperAdmin);
      console.log('✓ Super admin user activated');
    } else {
      console.log('✓ Super admin user is already active');
    }

    // Double-check: verify isActive is true
    const finalCheck = await userRepository.findOne({
      where: { email: 'admin@lims.com' },
    });
    if (finalCheck && !finalCheck.isActive) {
      console.warn('⚠ Warning: Super admin isActive is false, forcing activation...');
      finalCheck.isActive = true;
      await userRepository.save(finalCheck);
      console.log('✓ Super admin user force-activated');
    }

    console.log('\n=== Cleanup Summary ===');
    const finalUserCount = await userRepository.count();
    console.log(`✓ Database cleaned successfully`);
    console.log(`✓ Super admin user preserved: ${verifySuperAdmin.email}`);
    console.log(`✓ Total users remaining: ${finalUserCount}`);

    await dataSource.destroy();
    console.log('\n✓ Cleanup completed successfully!');
  } catch (error) {
    console.error('Error cleaning database:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

cleanDatabase();

