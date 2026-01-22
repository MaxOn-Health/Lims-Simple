/**
 * Test User Setup Script
 *
 * This script creates test users via the Super Admin account.
 * Run this before running E2E tests to ensure test users exist.
 *
 * Usage:
 *   ts-node e2e/helpers/setupTestUsers.ts
 *   or
 *   npm run test:setup-users
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Super Admin credentials (these should already exist)
const SUPER_ADMIN = {
  email: process.env.SUPER_ADMIN_EMAIL || 'admin@lims.com',
  password: process.env.SUPER_ADMIN_PASSWORD || 'Admin@123',
};

// Test users to create
const TEST_USERS_TO_CREATE = [
  {
    role: 'RECEPTIONIST',
    name: 'E2E Test Receptionist',
    emailPrefix: 'e2e-receptionist',
  },
  {
    role: 'TEST_TECHNICIAN',
    name: 'E2E Test X-Ray Technician',
    emailPrefix: 'e2e-xray-tech',
    testType: 'xray',
  },
  {
    role: 'TEST_TECHNICIAN',
    name: 'E2E Test Audiometry Technician',
    emailPrefix: 'e2e-audio-tech',
    testType: 'audiometry',
  },
  {
    role: 'TEST_TECHNICIAN',
    name: 'E2E Test Eye Technician',
    emailPrefix: 'e2e-eye-tech',
    testType: 'eye_test',
  },
  {
    role: 'TEST_TECHNICIAN',
    name: 'E2E Test PFT Technician',
    emailPrefix: 'e2e-pft-tech',
    testType: 'pft',
  },
  {
    role: 'TEST_TECHNICIAN',
    name: 'E2E Test ECG Technician',
    emailPrefix: 'e2e-ecg-tech',
    testType: 'ecg',
  },
  {
    role: 'LAB_TECHNICIAN',
    name: 'E2E Test Lab Technician',
    emailPrefix: 'e2e-lab-tech',
  },
  {
    role: 'DOCTOR',
    name: 'E2E Test Doctor',
    emailPrefix: 'e2e-doctor',
  },
];

// Generate a consistent password for test users
const TEST_USER_PASSWORD = 'E2E@Test@123';

/**
 * Login as Super Admin and get auth token
 */
async function loginAsAdmin(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(SUPER_ADMIN),
  });

  if (!response.ok) {
    throw new Error(`Failed to login as admin: ${response.status}`);
  }

  const data = await response.json();
  return data.accessToken || data.access_token;
}

/**
 * Create a user via API
 */
async function createUser(
  authToken: string,
  userData: any
): Promise<{ success: boolean; error?: string; user?: any }> {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    // Check if user already exists
    if (response.status === 409 || data.message?.includes('already exists')) {
      return { success: false, error: 'USER_EXISTS', user: data };
    }
    return { success: false, error: data.message || 'Unknown error' };
  }

  return { success: true, user: data };
}

/**
 * Get user by email (to check if exists)
 */
async function getUserByEmail(authToken: string, email: string): Promise<any | null> {
  const response = await fetch(`${API_BASE_URL}/users?email=${email}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  if (data.data && data.data.length > 0) {
    return data.data[0];
  }

  return null;
}

/**
 * Main setup function
 */
async function setupTestUsers() {
  console.log('🔧 Setting up E2E test users...');
  console.log(`📡 API URL: ${API_BASE_URL}`);
  console.log(`👤 Admin: ${SUPER_ADMIN.email}`);
  console.log('');

  try {
    // Login as admin
    console.log('🔐 Logging in as Super Admin...');
    const authToken = await loginAsAdmin();
    console.log('✅ Admin login successful');
    console.log('');

    // Store created users
    const createdUsers: any[] = [];
    const existingUsers: any[] = [];

    // Add super admin to the list
    createdUsers.push({
      ...SUPER_ADMIN,
      role: 'SUPER_ADMIN',
      name: 'Super Admin',
    });

    // Create each test user
    for (const testUser of TEST_USERS_TO_CREATE) {
      const email = `e2e-${Date.now()}-${testUser.emailPrefix}@lims.test`;
      const userData = {
        name: testUser.name,
        email: email,
        password: TEST_USER_PASSWORD,
        role: testUser.role,
        ...(testUser.testType && { testType: testUser.testType }),
      };

      console.log(`📝 Creating ${testUser.role}: ${testUser.name}`);
      console.log(`   Email: ${email}`);

      // Try to create user
      const result = await createUser(authToken, userData);

      if (result.success) {
        console.log(`   ✅ Created successfully`);
        createdUsers.push({
          email: email,
          password: TEST_USER_PASSWORD,
          role: testUser.role,
          name: testUser.name,
          ...(testUser.testType && { testType: testUser.testType }),
          id: result.user.id,
        });
      } else if (result.error === 'USER_EXISTS') {
        console.log(`   ⚠️  User already exists, fetching existing...`);
        // Try to get existing user
        const existing = await getUserByEmail(authToken, email);
        if (existing) {
          existingUsers.push({
            email: email,
            password: TEST_USER_PASSWORD, // Assuming password is the same
            role: testUser.role,
            name: testUser.name,
            ...(testUser.testType && { testType: testUser.testType }),
            id: existing.id,
          });
          console.log(`   ✅ Using existing user`);
        }
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
      }
      console.log('');
    }

    // Write users to file for use in tests
    const allUsers = [...createdUsers, ...existingUsers];

    const fs = await import('fs');
    const path = await import('path');

    const usersFile = path.join(__dirname, '../config/test-users.json');
    fs.mkdirSync(path.dirname(usersFile), { recursive: true });
    fs.writeFileSync(usersFile, JSON.stringify(allUsers, null, 2));

    console.log('✅ Setup complete!');
    console.log(`📄 Test users saved to: ${usersFile}`);
    console.log('');
    console.log('📊 Summary:');
    console.log(`   Total users: ${allUsers.length}`);
    console.log(`   - Super Admin: 1`);
    console.log(`   - Receptionist: ${allUsers.filter((u) => u.role === 'RECEPTIONIST').length}`);
    console.log(`   - Test Technicians: ${allUsers.filter((u) => u.role === 'TEST_TECHNICIAN').length}`);
    console.log(`   - Lab Technicians: ${allUsers.filter((u) => u.role === 'LAB_TECHNICIAN').length}`);
    console.log(`   - Doctors: ${allUsers.filter((u) => u.role === 'DOCTOR').length}`);
    console.log('');
    console.log('🔑 Test user password: ' + TEST_USER_PASSWORD);
    console.log('');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupTestUsers();
}

export { setupTestUsers };
