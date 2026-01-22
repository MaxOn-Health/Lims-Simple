import { test as base } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Load test users from the config file
 * These users are created by the setupTestUsers.ts script
 */
function loadTestUsers() {
  const usersPath = path.join(__dirname, '../config/test-users.json');

  // Default fallback users (matching seed data)
  const defaultUsers = {
    SUPER_ADMIN: {
      email: 'admin@lims.com',
      password: 'Admin@123',
      role: 'SUPER_ADMIN',
      name: 'Super Admin',
    },
    RECEPTIONIST: {
      email: 'receptionist@lims.com',
      password: 'Receptionist@123',
      role: 'RECEPTIONIST',
      name: 'Receptionist',
    },
    TEST_TECHNICIAN: {
      email: 'xray@lims.com',
      password: 'TestAdmin@123',
      role: 'TEST_TECHNICIAN',
      name: 'X-Ray Technician',
      testType: 'xray',
    },
    AUDIOMETRY_TECHNICIAN: {
      email: 'audiometry@lims.com',
      password: 'TestAdmin@123',
      role: 'TEST_TECHNICIAN',
      name: 'Audiometry Technician',
      testType: 'audiometry',
    },
    LAB_TECHNICIAN: {
      email: 'labtech@lims.com',
      password: 'LabTech@123',
      role: 'LAB_TECHNICIAN',
      name: 'Lab Technician',
    },
    DOCTOR: {
      email: 'doctor@lims.com',
      password: 'Doctor@123',
      role: 'DOCTOR',
      name: 'Doctor',
    },
  };

  if (!fs.existsSync(usersPath)) {
    console.warn('⚠️  Test users config not found. Run: npm run test:setup-users');
    return defaultUsers;
  }

  try {
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));

    // Convert array to object by role
    const usersByRole: Record<string, any> = {};
    for (const user of usersData) {
      const key = user.role;
      if (!usersByRole[key]) {
        usersByRole[key] = user;
      } else if (user.testType) {
        // For test technicians, store by test type
        usersByRole[`${key}_${user.testType}`.toUpperCase()] = user;
      }
    }

    // Ensure super admin exists
    if (!usersByRole.SUPER_ADMIN) {
      usersByRole.SUPER_ADMIN = defaultUsers.SUPER_ADMIN;
    }

    return usersByRole;
  } catch (error) {
    console.error('❌ Failed to load test users:', error);
    return defaultUsers;
  }
}

const TEST_USERS = loadTestUsers();

/**
 * Get test users object
 */
export { TEST_USERS };

/**
 * Get user by role
 */
export function getUserByRole(role: string, testType?: string): any {
  if (testType) {
    return TEST_USERS[`${role}_${testType}`.toUpperCase()] || TEST_USERS[role];
  }
  return TEST_USERS[role];
}

/**
 * Get all test users
 */
export function getAllTestUsers(): Record<string, any> {
  return TEST_USERS;
}

/**
 * Authenticated page fixture
 */
export const test = base.extend<{
  loginPage: import('../pages/LoginPage').LoginPage;
  authenticatedPage: import('../pages/BasePage').BasePage;
}>({
  /**
   * Login page fixture - provides access to login functionality
   */
  loginPage: async ({ page }, use) => {
    const { LoginPage } = await import('../pages/LoginPage');
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  /**
   * Authenticated page fixture - logs in as SUPER_ADMIN by default
   */
  authenticatedPage: async ({ page }, use) => {
    const { LoginPage } = await import('../pages/LoginPage');
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    await use(loginPage);
  },
});

/**
 * Role-specific authenticated fixtures
 * These automatically login as the specified role
 */
export const testWithAuth = base.extend<{
  asSuperAdmin: import('../pages/BasePage').BasePage;
  asReceptionist: import('../pages/BasePage').BasePage;
  asTestTechnician: import('../pages/BasePage').BasePage;
  asLabTechnician: import('../pages/BasePage').BasePage;
  asDoctor: import('../pages/BasePage').BasePage;
}>({
  asSuperAdmin: async ({ page }, use) => {
    const { LoginPage } = await import('../pages/LoginPage');
    const loginPage = new LoginPage(page);
    const user = TEST_USERS.SUPER_ADMIN;
    if (!user) throw new Error('SUPER_ADMIN user not found. Run: npm run test:setup-users');
    await loginPage.goto();
    await loginPage.login(user.email, user.password);
    await use(loginPage);
  },

  asReceptionist: async ({ page }, use) => {
    const { LoginPage } = await import('../pages/LoginPage');
    const loginPage = new LoginPage(page);
    const user = TEST_USERS.RECEPTIONIST;
    if (!user) throw new Error('RECEPTIONIST user not found. Run: npm run test:setup-users');
    await loginPage.goto();
    await loginPage.login(user.email, user.password);
    await use(loginPage);
  },

  asTestTechnician: async ({ page }, use) => {
    const { LoginPage } = await import('../pages/LoginPage');
    const loginPage = new LoginPage(page);
    // Get any test technician (xray, audiometry, etc.)
    const user = TEST_USERS.TEST_TECHNICIAN || TEST_USERS.TEST_TECHNICIAN_XRAY;
    if (!user) throw new Error('TEST_TECHNICIAN user not found. Run: npm run test:setup-users');
    await loginPage.goto();
    await loginPage.login(user.email, user.password);
    await use(loginPage);
  },

  asLabTechnician: async ({ page }, use) => {
    const { LoginPage } = await import('../pages/LoginPage');
    const loginPage = new LoginPage(page);
    const user = TEST_USERS.LAB_TECHNICIAN;
    if (!user) throw new Error('LAB_TECHNICIAN user not found. Run: npm run test:setup-users');
    await loginPage.goto();
    await loginPage.login(user.email, user.password);
    await use(loginPage);
  },

  asDoctor: async ({ page }, use) => {
    const { LoginPage } = await import('../pages/LoginPage');
    const loginPage = new LoginPage(page);
    const user = TEST_USERS.DOCTOR;
    if (!user) throw new Error('DOCTOR user not found. Run: npm run test:setup-users');
    await loginPage.goto();
    await loginPage.login(user.email, user.password);
    await use(loginPage);
  },
});

/**
 * Custom fixture that accepts a role parameter
 */
export const testAsRole = base.extend<{
  asRole: (role: string, testType?: string) => Promise<import('../pages/BasePage').BasePage>;
}>({
  asRole: async ({ page }, use) => {
    const loginAsRole = async (role: string, testType?: string) => {
      const { LoginPage } = await import('../pages/LoginPage');
      const loginPage = new LoginPage(page);
      const user = getUserByRole(role, testType);
      if (!user) {
        throw new Error(`User with role ${role}${testType ? ` (${testType})` : ''} not found. Run: npm run test:setup-users`);
      }
      await loginPage.goto();
      await loginPage.login(user.email, user.password);
      return loginPage;
    };
    await use(loginAsRole);
  },
});

export { expect } from '@playwright/test';
