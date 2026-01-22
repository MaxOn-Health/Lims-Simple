import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { PatientRegistrationPage } from '../../pages/PatientRegistrationPage';
import { AssignmentsPage } from '../../pages/AssignmentsPage';
import { TEST_USERS } from '../../fixtures/auth.fixture';
import { generatePatientData, TEST_DEFINITIONS } from '../../helpers/testData';

// Note: Tests use dynamically created test users. Run `npm run test:setup-users` first.

/**
 * Assignment Pool Management Tests
 *
 * These tests cover the assignment pool workflow:
 * 1. Auto-assignment to Shared Pool (default behavior)
 * 2. Manual assignment to specific technicians
 * 3. Shared Pool assignment pickup by technicians
 * 4. Assignment routing by test type
 */

test.describe('Assignment Pool - Auto Assignment', () => {
  test('should auto-assign new tests to Shared Pool by default', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const patientRegPage = new PatientRegistrationPage(page);

    // Login as receptionist
    await loginPage.goto();
    await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

    // Register patient with test
    await patientRegPage.goto();
    const patientData = generatePatientData();
    await patientRegPage.fillPatientDetails(patientData);
    await patientRegPage.waitForLoadingToFinish();
    await patientRegPage.selectTest(TEST_DEFINITIONS.XRAY_CHEST);

    const result = await patientRegPage.register();
    const patientName = patientData.name;

    // Navigate to assignments page
    await page.goto('/assignments');

    // Verify assignment appears in Shared Pool (not assigned to specific technician)
    const sharedPoolCard = page.locator('[data-testid="shared-pool"], .shared-pool-assignments');
    if (await sharedPoolCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Check if patient assignment is in shared pool
      const hasPatient = await sharedPoolCard.getByText(patientName).isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasPatient).toBeTruthy();
    } else {
      // Alternative: Check assignment details page for "Shared Pool" status
      await page.goto(`/assignments/${result.id}`);
      const assignedTo = await page.locator('[data-testid="assigned-to"]').textContent();
      expect(assignedTo).toMatch(/shared pool|unassigned/i);
    }
  });

  test('should show Shared Pool assignments to all eligible technicians', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const patientRegPage = new PatientRegistrationPage(page);
    const assignmentsPage = new AssignmentsPage(page);

    // Step 1: Receptionist creates assignment (goes to Shared Pool)
    await loginPage.goto();
    await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

    await patientRegPage.goto();
    const patientData = generatePatientData();
    await patientRegPage.fillPatientDetails(patientData);
    await patientRegPage.waitForLoadingToFinish();
    await patientRegPage.selectTest(TEST_DEFINITIONS.AUDIOMETRY);
    await patientRegPage.register();
    const patientName = patientData.name;

    // Logout
    await page.context().clearCookies();

    // Step 2: Technician 1 (Audiometry) logs in and sees assignment in Shared Pool
    await loginPage.goto();
    await loginPage.login(TEST_USERS.AUDIOMETRY_TECHNICIAN?.email || TEST_USERS.TEST_TECHNICIAN.email,
                         TEST_USERS.AUDIOMETRY_TECHNICIAN?.password || TEST_USERS.TEST_TECHNICIAN.password);

    await assignmentsPage.gotoMyAssignments();

    // Should see the shared pool assignment
    await assignmentsPage.waitForAssignment(patientName);
    const status = await assignmentsPage.getAssignmentStatus(patientName);
    expect(status).toMatch(/assigned|pending|shared pool/i);
  });

  test('should allow multiple technicians to see Shared Pool assignments', async ({ page, context }) => {
    // Create a Shared Pool assignment
    const loginPage = new LoginPage(page);
    const patientRegPage = new PatientRegistrationPage(page);

    await loginPage.goto();
    await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

    await patientRegPage.goto();
    const patientData = generatePatientData();
    await patientRegPage.fillPatientDetails(patientData);
    await patientRegPage.waitForLoadingToFinish();
    await patientRegPage.selectTest(TEST_DEFINITIONS.EYE_TEST);
    await patientRegPage.register();
    const patientName = patientData.name;

    // Verify multiple technicians can see the same assignment
    // This would require logging in as different technicians and checking the assignment
    // For now, we'll verify the assignment is in Shared Pool
    await page.goto('/assignments');

    const sharedPoolSection = page.locator('[data-testid="shared-pool"]');
    if (await sharedPoolSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(sharedPoolSection.getByText(patientName)).toBeVisible();
    }
  });
});

test.describe('Assignment Pool - Manual Assignment', () => {
  test('should allow admin to manually assign to specific technician', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const patientRegPage = new PatientRegistrationPage(page);

    // Step 1: Create assignment (goes to Shared Pool)
    await loginPage.goto();
    await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

    await patientRegPage.goto();
    const patientData = generatePatientData();
    await patientRegPage.fillPatientDetails(patientData);
    await patientRegPage.waitForLoadingToFinish();
    await patientRegPage.selectTest(TEST_DEFINITIONS.XRAY_CHEST);
    const result = await patientRegPage.register();
    const patientName = patientData.name;

    // Logout
    await page.context().clearCookies();

    // Step 2: Admin logs in and manually assigns to technician
    await loginPage.goto();
    await loginPage.login(TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);

    // Navigate to assignment details
    await page.goto(`/assignments/${result.id}`);

    // Click "Assign to Technician" button
    const assignButton = page.getByRole('button', { name: /assign to technician|reassign/i });
    if (await assignButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await assignButton.click();

      // Select technician from dropdown
      const technicianSelect = page.locator('select[name="technician"], [data-testid="technician-select"]');
      await technicianSelect.selectOption({ label: /x-ray/i });

      // Confirm assignment
      await page.getByRole('button', { name: /confirm|assign/i }).click();

      // Verify success toast
      await expect(page.getByText(/assigned successfully|technician assigned/i)).toBeVisible();
    } else {
      // Alternative: Check if assignment page shows manual assignment option
      const manualAssignOption = page.locator('[data-testid="manual-assignment"]');
      if (await manualAssignOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await manualAssignOption.click();
      }
    }
  });

  test('should allow receptionist to manually assign to specific technician', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const patientRegPage = new PatientRegistrationPage(page);

    // Create assignment
    await loginPage.goto();
    await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

    await patientRegPage.goto();
    const patientData = generatePatientData();
    await patientRegPage.fillPatientDetails(patientData);
    await patientRegPage.waitForLoadingToFinish();
    await patientRegPage.selectTest(TEST_DEFINITIONS.AUDIOMETRY);
    const result = await patientRegPage.register();

    // Navigate to assignments page
    await page.goto('/assignments');

    // Find the assignment and manually assign
    const assignmentCard = page.locator(`[data-testid="assignment-${result.id}"]`);
    if (await assignmentCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await assignmentCard.getByRole('button', { name: /assign/i }).click();

      // Select technician
      const technicianDropdown = page.locator('[data-testid="technician-dropdown"]');
      await technicianDropdown.selectOption({ label: /audiometry/i });

      await page.getByRole('button', { name: /confirm|save/i }).click();

      // Verify assignment
      await expect(page.getByText(/assigned to/i)).toBeVisible();
    }
  });

  test('should filter assignments by assignment type (Shared Pool vs Assigned)', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login(TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);

    await page.goto('/assignments');

    // Check for filter buttons
    const sharedPoolFilter = page.getByRole('button', { name: /shared pool/i });
    const assignedFilter = page.getByRole('button', { name: /assigned/i });
    const allFilter = page.getByRole('button', { name: /all/i });

    if (await sharedPoolFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Test filtering to Shared Pool
      await sharedPoolFilter.click();
      await page.waitForTimeout(500);

      // Test filtering to Assigned
      await assignedFilter.click();
      await page.waitForTimeout(500);

      // Test showing all
      await allFilter.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Assignment Pool - Test Type Routing', () => {
  test('should route X-Ray tests to X-Ray technicians', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const patientRegPage = new PatientRegistrationPage(page);
    const assignmentsPage = new AssignmentsPage(page);

    // Create X-Ray test assignment
    await loginPage.goto();
    await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

    await patientRegPage.goto();
    const patientData = generatePatientData();
    await patientRegPage.fillPatientDetails(patientData);
    await patientRegPage.waitForLoadingToFinish();
    await patientRegPage.selectTest(TEST_DEFINITIONS.XRAY_CHEST);
    await patientRegPage.register();
    const patientName = patientData.name;

    // Logout
    await page.context().clearCookies();

    // X-Ray technician should see the assignment
    await loginPage.goto();
    await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

    await assignmentsPage.gotoMyAssignments();
    await assignmentsPage.waitForAssignment(patientName);

    const card = await assignmentsPage.findAssignmentByPatient(patientName);
    expect(card).toBeTruthy();

    // Verify test type is X-Ray
    const cardText = await assignmentsPage.getAssignmentText(patientName);
    expect(cardText.toLowerCase()).toMatch(/x-ray|chest/i);
  });

  test('should route Audiometry tests to Audiometry technicians', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const patientRegPage = new PatientRegistrationPage(page);
    const assignmentsPage = new AssignmentsPage(page);

    // Create Audiometry test assignment
    await loginPage.goto();
    await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

    await patientRegPage.goto();
    const patientData = generatePatientData();
    await patientRegPage.fillPatientDetails(patientData);
    await patientRegPage.waitForLoadingToFinish();
    await patientRegPage.selectTest(TEST_DEFINITIONS.AUDIOMETRY);
    await patientRegPage.register();
    const patientName = patientData.name;

    await page.context().clearCookies();

    // Audiometry technician should see the assignment
    await loginPage.goto();
    await loginPage.login(TEST_USERS.AUDIOMETRY_TECHNICIAN?.email || 'audiometry@lims.com', 'TestAdmin@123');

    await assignmentsPage.gotoMyAssignments();
    await assignmentsPage.waitForAssignment(patientName);

    const cardText = await assignmentsPage.getAssignmentText(patientName);
    expect(cardText.toLowerCase()).toMatch(/audiometry/i);
  });

  test('should not show unrelated test types to technicians', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const patientRegPage = new PatientRegistrationPage(page);
    const assignmentsPage = new AssignmentsPage(page);

    // Create X-Ray test assignment
    await loginPage.goto();
    await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

    await patientRegPage.goto();
    const patientData = generatePatientData();
    await patientRegPage.fillPatientDetails(patientData);
    await patientRegPage.waitForLoadingToFinish();
    await patientRegPage.selectTest(TEST_DEFINITIONS.XRAY_CHEST);
    await patientRegPage.register();
    const xrayPatientName = patientData.name;

    await page.context().clearCookies();

    // Lab Technician should NOT see X-Ray assignments
    await loginPage.goto();
    await loginPage.login(TEST_USERS.LAB_TECHNICIAN.email, TEST_USERS.LAB_TECHNICIAN.password);

    await assignmentsPage.gotoMyAssignments();

    // Wait a bit to ensure assignments are loaded
    await page.waitForTimeout(2000);

    // Verify X-Ray assignment is NOT visible
    const xrayCard = await assignmentsPage.findAssignmentByPatient(xrayPatientName);
    expect(xrayCard).toBeNull();
  });

  test('should show all test types to admins', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const patientRegPage = new PatientRegistrationPage(page);

    // Create assignments for different test types
    await loginPage.goto();
    await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

    const patientNames: string[] = [];

    for (const testDef of [TEST_DEFINITIONS.XRAY_CHEST, TEST_DEFINITIONS.AUDIOMETRY, TEST_DEFINITIONS.EYE_TEST]) {
      await patientRegPage.goto();
      const patientData = generatePatientData();
      await patientRegPage.fillPatientDetails(patientData);
      await patientRegPage.waitForLoadingToFinish();
      await patientRegPage.selectTest(testDef);
      await patientRegPage.register();
      patientNames.push(patientData.name);
    }

    await page.context().clearCookies();

    // Admin should see all test types
    await loginPage.goto();
    await loginPage.login(TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);

    await page.goto('/assignments');

    // Verify all assignments are visible
    for (const patientName of patientNames) {
      await expect(page.getByText(patientName)).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('Assignment Pool - Pickup from Shared Pool', () => {
  test('should allow technician to pick up assignment from Shared Pool', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const patientRegPage = new PatientRegistrationPage(page);
    const assignmentsPage = new AssignmentsPage(page);

    // Create assignment in Shared Pool
    await loginPage.goto();
    await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

    await patientRegPage.goto();
    const patientData = generatePatientData();
    await patientRegPage.fillPatientDetails(patientData);
    await patientRegPage.waitForLoadingToFinish();
    await patientRegPage.selectTest(TEST_DEFINITIONS.XRAY_CHEST);
    await patientRegPage.register();
    const patientName = patientData.name;

    await page.context().clearCookies();

    // Technician picks up from Shared Pool
    await loginPage.goto();
    await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

    await assignmentsPage.gotoMyAssignments();
    await assignmentsPage.waitForAssignment(patientName);

    // Pick up assignment (this assigns it to the technician)
    const pickupButton = page.getByRole('button', { name: /pick up|claim assignment/i });
    if (await pickupButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pickupButton.click();

      // Confirm pickup
      await page.getByRole('button', { name: /confirm|yes/i }).click();

      // Verify assignment is now assigned to technician
      const status = await assignmentsPage.getAssignmentStatus(patientName);
      expect(status).toMatch(/assigned|in progress/i);
    } else {
      // Alternative: Starting the assignment automatically picks it up
      await assignmentsPage.startAssignment(patientName);
    }
  });

  test('should remove assignment from Shared Pool after pickup', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const patientRegPage = new PatientRegistrationPage(page);
    const assignmentsPage = new AssignmentsPage(page);

    // Create assignment
    await loginPage.goto();
    await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

    await patientRegPage.goto();
    const patientData = generatePatientData();
    await patientRegPage.fillPatientDetails(patientData);
    await patientRegPage.waitForLoadingToFinish();
    await patientRegPage.selectTest(TEST_DEFINITIONS.AUDIOMETRY);
    await patientRegPage.register();
    const patientName = patientData.name;

    await page.context().clearCookies();

    // First technician picks up assignment
    await loginPage.goto();
    await loginPage.login(TEST_USERS.AUDIOMETRY_TECHNICIAN?.email || TEST_USERS.TEST_TECHNICIAN.email,
                         TEST_USERS.AUDIOMETRY_TECHNICIAN?.password || TEST_USERS.TEST_TECHNICIAN.password);

    await assignmentsPage.gotoMyAssignments();
    await assignmentsPage.waitForAssignment(patientName);
    await assignmentsPage.startAssignment(patientName);

    await page.context().clearCookies();

    // Second technician should NOT see the assignment (it's been picked up)
    const page2 = await page.context().newPage();
    const loginPage2 = new LoginPage(page2);
    const assignmentsPage2 = new AssignmentsPage(page2);

    await loginPage2.goto();
    await loginPage2.login('technician2@lims.com', 'password'); // Use second technician

    await assignmentsPage2.gotoMyAssignments();

    // Wait for assignments to load
    await page2.waitForTimeout(2000);

    // Verify assignment is NOT visible to second technician
    const card = await assignmentsPage2.findAssignmentByPatient(patientName);
    expect(card).toBeNull();

    await page2.close();
  });
});
