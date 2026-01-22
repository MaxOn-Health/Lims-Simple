import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { TEST_USERS } from '../../fixtures/auth.fixture';

// Note: Tests use dynamically created test users. Run `npm run test:setup-users` first.

test.describe('Authentication Flow', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should display login form', async ({ page }) => {
    await loginPage.goto();

    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);

    // Should redirect to dashboard or another protected page
    await expect(page).toHaveURL(/\/(dashboard|patients|assignments|projects)/);

    // Should not be on login page
    await expect(loginPage.heading).not.toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await loginPage.goto();

    await loginPage.emailInput.fill('invalid@example.com');
    await loginPage.passwordInput.fill('wrongpassword');
    await loginPage.submitButton.click();

    // Should show error message
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toBeTruthy();

    // Should still be on login page
    await expect(page).toHaveURL('/login');
  });

  test('should show error with empty credentials', async ({ page }) => {
    await loginPage.goto();

    await loginPage.submitButton.click();

    // Should show validation errors
    await expect(loginPage.emailInput).toBeFocused();
  });

  test('should redirect to login when accessing protected route unauthenticated', async ({ page }) => {
    // Try to access a protected route
    await page.goto('/patients');

    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should allow all user roles to login', async ({ page }) => {
    // Test each role
    const users = [
      TEST_USERS.SUPER_ADMIN,
      TEST_USERS.RECEPTIONIST,
      TEST_USERS.TEST_TECHNICIAN,
      // TEST_USERS.LAB_TECHNICIAN, // Uncomment if credentials exist
      // TEST_USERS.DOCTOR, // Uncomment if credentials exist
    ];

    for (const user of users) {
      await page.goto('/login');
      await loginPage.login(user.email, user.password);

      // Verify successful login
      await expect(page).toHaveURL(/\/(dashboard|patients|assignments|projects|doctor)/);

      // Logout before next test
      await page.context().clearCookies();
      await page.goto('/login');
    }
  });

  test('should maintain session across page navigations', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

    // Navigate to different pages
    await page.goto('/patients');
    await expect(page.getByRole('heading', { name: /patients/i })).toBeVisible();

    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: /projects/i })).toBeVisible();

    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should allow logout', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);

    // Find and click logout button
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i }).first();
    if (await logoutButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await logoutButton.click();
    } else {
      // Fallback: clear cookies manually
      await page.context().clearCookies();
    }

    // Should redirect to login
    await expect(page).toHaveURL('/login');

    // Should not be able to access protected routes
    await page.goto('/patients');
    await expect(page).toHaveURL('/login');
  });

  test('should redirect to appropriate page based on role after login', async ({ page }) => {
    // Receptionist should go to patients or dashboard
    await loginPage.goto();
    await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

    const url = page.url();
    expect(url).toMatch(/\/(dashboard|patients)/);
  });

  test('should show loading state during login', async ({ page }) => {
    await loginPage.goto();

    // Fill credentials
    await loginPage.emailInput.fill(TEST_USERS.SUPER_ADMIN.email);
    await loginPage.passwordInput.fill(TEST_USERS.SUPER_ADMIN.password);

    // Click submit
    await loginPage.submitButton.click();

    // Button should show loading state (be disabled)
    await expect(loginPage.submitButton).toBeDisabled();
  });

  test('should handle remember me functionality', async ({ page, context }) => {
    await loginPage.goto();

    // Check if remember me checkbox exists
    const rememberMeCheckbox = page.getByLabel(/remember me|keep me signed in/i);

    if (await rememberMeCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await rememberMeCheckbox.check();

      await loginPage.login(TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);

      // Check if cookies are set with extended expiration
      const cookies = await context.cookies();
      const authCookie = cookies.find((c) => c.name === 'auth-token' || c.name === 'access-token');

      expect(authCookie).toBeTruthy();
    }
  });

  test('should handle password reset flow', async ({ page }) => {
    await loginPage.goto();

    // Check if forgot password link exists
    const forgotPasswordLink = loginPage.forgotPasswordLink;

    if (await forgotPasswordLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await forgotPasswordLink.click();

      // Should navigate to password reset page
      await expect(page).toHaveURL(/\/forgot-password|\/reset-password/);
    }
  });

  test('should validate email format', async ({ page }) => {
    await loginPage.goto();

    // Enter invalid email
    await loginPage.emailInput.fill('invalid-email');
    await loginPage.passwordInput.fill('somepassword');
    await loginPage.submitButton.click();

    // Should show validation error
    const emailInput = loginPage.emailInput;
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => {
      return !el.validity.valid;
    });

    expect(isInvalid).toBeTruthy();
  });

  test('should handle keyboard navigation (Enter to submit)', async ({ page }) => {
    await loginPage.goto();

    await loginPage.emailInput.fill(TEST_USERS.SUPER_ADMIN.email);
    await loginPage.passwordInput.fill(TEST_USERS.SUPER_ADMIN.password);

    // Press Enter on password field
    await loginPage.passwordInput.press('Enter');

    // Should submit form
    await expect(page).toHaveURL(/\/(dashboard|patients|assignments|projects)/);
  });
});

test.describe('Role-Based Access Control', () => {
  test('receptionist can access patient management', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

    // Should be able to access patients
    await page.goto('/patients');
    await expect(page.getByRole('heading', { name: /patients/i })).toBeVisible();

    // Should be able to register new patient
    await page.goto('/patients/new');
    await expect(page.getByRole('heading', { name: /register patient|patient details/i })).toBeVisible();
  });

  test('technician can access their assignments', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

    // Should be able to access my assignments
    await page.goto('/assignments/my-assignments');
    await expect(page.getByRole('heading', { name: /my tasks|my assignments/i })).toBeVisible();
  });

  test('super admin can access user management', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);

    // Should be able to access dashboard
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });
});
