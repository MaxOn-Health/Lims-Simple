import { DataSource } from 'typeorm';
import { User, UserRole } from '../../modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

export async function createSuperAdmin(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);

  // Check if super admin already exists
  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@lims.com' },
  });

  if (existingAdmin) {
    console.log('Super admin already exists');
    return;
  }

  // Create super admin
  const passwordHash = await bcrypt.hash('Admin@123', 10);

  const superAdmin = userRepository.create({
    email: 'admin@lims.com',
    passwordHash,
    fullName: 'Super Admin',
    role: UserRole.SUPER_ADMIN,
    testAdminType: null,
    isActive: true,
    passkeyCredentialId: null,
    passkeyPublicKey: null,
  });

  await userRepository.save(superAdmin);
  console.log('Super admin created successfully');
  console.log('Email: admin@lims.com');
  console.log('Password: Admin@123');
}

