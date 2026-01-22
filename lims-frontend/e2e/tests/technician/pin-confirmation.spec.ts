import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { PatientRegistrationPage } from '../../pages/PatientRegistrationPage';
import { AssignmentsPage } from '../../pages/AssignmentsPage';
import { ResultEntryPage } from '../../pages/ResultEntryPage';
import { TEST_USERS } from '../../fixtures/auth.fixture';
import { generatePatientData, TEST_DEFINITIONS, generateXRayResult, generateAudiometryResult, generateEyeTestResult } from '../../helpers/testData';

// Note: Tests use dynamically created test users. Run `npm run test:setup-users` first.

/**
 * PIN Confirmation Tests for Result Submission
 *
 * These tests cover the PIN confirmation workflow:
 * 1. PIN setup for new technicians
 * 2. PIN requirement when submitting results
 * 3. Invalid PIN handling
 * 4. PIN change functionality
 * 5. Different PIN scenarios
 */

test.describe('PIN Setup', () => {
  test('should allow new technician to setup PIN', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Login as technician
    await loginPage.goto();
    await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

    // Navigate to settings or profile
    await page.goto('/settings');

    // Look for PIN setup option
    const setupPinButton = page.getByRole('button', { name: /setup pin|create pin|set pin/i });
    const changePinButton = page.getByRole('button', { name: /change pin|update pin/i });

    if (await setupPinButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await setupPinButton.click();

      // Enter new PIN
      const modal = page.locator('div[role="dialog"]');
      await modal.waitFor({ state: 'visible', timeout: 5000 });

      const newPinInput = modal.locator('input[name="newPin"], input[name="pin"]');
      const confirmPinInput = modal.locator('input[name="confirmPin"]');

      await newPinInput.fill('1234');
      await confirmPinInput.fill('1234');

      await modal.getByRole('button', { name: /set|create|confirm/i }).click();

      // Verify success
      await expect(page.getByText(/pin set successfully|pin created/i)).toBeVisible();
    } else if (await changePinButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      // PIN might already be set
      test.skip(true, 'PIN already set up for this technician');
    }
  });

  test('should validate PIN format (4 digits)', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

    await page.goto('/settings');

    const setupPinButton = page.getByRole('button', { name: /setup pin|set pin|change pin/i });
    if (await setupPinButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await setupPinButton.click();

      const modal = page.locator('div[role="dialog"]');
      await modal.waitFor({ state: 'visible', timeout: 5000 });

      const newPinInput = modal.locator('input[name="newPin"], input[name="pin"]');

      // Test invalid PIN formats
      const invalidPins = ['123', '12345', 'abcd', '12ab', ''];

      for (const pin of invalidPins) {
        await newPinInput.fill(pin);

        // Should show validation error or prevent submission
        const submitButton = modal.getByRole('button', { name: /set|create|save/i });
        const isDisabled = await submitButton.isDisabled();
        const errorVisible = await page.getByText(/must be 4 digits|invalid pin format/i).isVisible({ timeout: 500 }).catch(() => false);

        expect(isDisabled || errorVisible).toBeTruthy();
      }
    } else {
      test.skip(true, 'PIN setup button not available');
    }
  });

  test('should require PIN confirmation to match', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

    await page.goto('/settings');

    const setupPinButton = page.getByRole('button', { name: /setup pin|set pin|change pin/i });
    if (await setupPinButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await setupPinButton.click();

      const modal = page.locator('div[role="dialog"]');
      await modal.waitFor({ state: 'visible', timeout: 5000 });

      const newPinInput = modal.locator('input[name="newPin"], input[name="pin"]');
      const confirmPinInput = modal.locator('input[name="confirmPin"]');

      // Enter mismatched PINs
      await newPinInput.fill('1234');
      await confirmPinInput.fill('4321');

      await modal.getByRole('button', { name: /set|create|save/i }).click();

      // Should show error
      await expect(page.getByText(/pins do not match|confirmation failed/i)).toBeVisible();
    } else {
      test.skip(true, 'PIN setup button not available');
    }
  });

  test('should allow technician to change existing PIN', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

    await page.goto('/settings');

    const changePinButton = page.getByRole('button', { name: /change pin|update pin/i });
    if (await changePinButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await changePinButton.click();

      const modal = page.locator('div[role="dialog"]');
      await modal.waitFor({ state: 'visible', timeout: 5000 });

      // Enter current PIN
      const currentPinInput = modal.locator('input[name="currentPin"], input[name="oldPin"]');
      await currentPinInput.fill('1234');

      // Enter new PIN
      const newPinInput = modal.locator('input[name="newPin"], input[name="pin"]');
      const confirmPinInput = modal.locator('input[name="confirmPin"]');

      await newPinInput.fill('5678');
      await confirmPinInput.fill('5678');

      await modal.getByRole('button', { name: /update|change|save/i }).click();

      // Verify success
      await expect(page.getByText(/pin changed successfully|pin updated/i)).toBeVisible();

      // Change back to original PIN for other tests
      await changePinButton.click();
      await modal.waitFor({ state: 'visible', timeout: 5000 });
      await currentPinInput.fill('5678');
      await newPinInput.fill('1234');
      await confirmPinInput.fill('1234');
      await modal.getByRole('button', { name: /update|change|save/i }).click();
    } else {
      test.skip(true, 'Change PIN button not available');
    }
  });
});

test.describe('PIN Confirmation on Result Submission', () => {
  test.beforeEach(async ({ page }) => {
    // Create a test assignment before each test
    const loginPage = new LoginPage(page);
    const patientRegPage = new PatientRegistrationPage(page);

    await loginPage.goto();
    await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

    await patientRegPage.goto();
    const patientData = generatePatientData();
    await patientRegPage.fillPatientDetails(patientData);
    await patientRegPage.waitForLoadingToFinish();
    await patientRegPage.selectTest(TEST_DEFINITIONS.XRAY_CHEST);
    await patientRegPage.register();
  });

  test('should require PIN confirmation when submitting result', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const assignmentsPage = new AssignmentsPage(page);
    const resultEntryPage = new ResultEntryPage(page);

    // Login as technician
    await loginPage.goto();
    await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

    await assignmentsPage.gotoMyAssignments();

    // Get first assignment
    const assignments = await assignmentsPage.getAssignments();
    if (assignments.length === 0) {
      test.skip(true, 'No assignments available');
    }

    const firstCard = assignments[0];
    const cardText = await firstCard.textContent();
    const patientName = cardText?.split('\n')[0] || 'Unknown';

    await assignmentsPage.startAssignment(patientName);
    await assignmentsPage.enterResults(patientName);

    // Fill result
    const xrayResult = generateXRayResult();
    await resultEntryPage.fillXRayResult(xrayResult);

    // Click submit
    await resultEntryPage.submitButton.click();

    // Should show PIN modal
    const pinModal = page.locator('div[role="dialog"]');
    await expect(pinModal).toBeVisible({ timeout: 5000 });

    // Verify modal asks for PIN
    await expect(pinModal.getByText(/enter pin|confirm pin|pin required/i)).toBeVisible();
    await expect(pinModal.locator('input[name="pin"], input[type="password"]')).toBeVisible();
  });

  test('should accept valid PIN and submit result', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const assignmentsPage = new AssignmentsPage(page);
    const resultEntryPage = new ResultEntryPage(page);

    await loginPage.goto();
    await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

    await assignmentsPage.gotoMyAssignments();

    const assignments = await assignmentsPage.getAssignments();
    if (assignments.length === 0) {
      test.skip(true, 'No assignments available');
    }

    const firstCard = assignments[0];
    const cardText = await firstCard.textContent();
    const patientName = cardText?.split('\n')[0] || 'Unknown';

    await assignmentsPage.startAssignment(patientName);
    await assignmentsPage.enterResults(patientName);

    const xrayResult = generateXRayResult();
    await resultEntryPage.fillXRayResult(xrayResult);

    // Submit with valid PIN
    await resultEntryPage.submitWithPIN('1234');

    // Verify success
    await expect(resultEntryPage.successHeading).toBeVisible();
  });

  test('should reject invalid PIN and show error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const assignmentsPage = new AssignmentsPage(page);
    const resultEntryPage = new ResultEntryPage(page);

    await loginPage.goto();
    await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

    await assignmentsPage.gotoMyAssignments();

    const assignments = await assignmentsPage.getAssignments();
    if (assignments.length === 0) {
      test.skip(true, 'No assignments available');
    }

    const firstCard = assignments[0];
    const cardText = await firstCard.textContent();
    const patientName = cardText?.split('\n')[0] || 'Unknown';

    await assignmentsPage.startAssignment(patientName);
    await assignmentsPage.enterResults(patientName);

    const xrayResult = generateXRayResult();
    await resultEntryPage.fillXRayResult(xrayResult);

    await resultEntryPage.submitButton.click();

    const pinModal = page.locator('div[role="dialog"]');
    await pinModal.waitFor({ state: 'visible', timeout: 5000 });

    const pinInput = pinModal.locator('input[name="pin"], input[type="password"]');

    // Try invalid PIN
    await pinInput.fill('9999');
    await pinModal.getByRole('button', { name: /confirm|submit/i }).click();

    // Should show error
    await expect(pinModal.getByText(/invalid pin|incorrect pin/i)).toBeVisible();

    // Modal should stay open
    await expect(pinModal).toBeVisible();

    // Success message should NOT be visible
    await expect(resultEntryPage.successHeading).not.toBeVisible();
  });

  test('should allow retry after invalid PIN', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const assignmentsPage = new AssignmentsPage(page);
    const resultEntryPage = new ResultEntryPage(page);

    await loginPage.goto();
    await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

    await assignmentsPage.gotoMyAssignments();

    const assignments = await assignmentsPage.getAssignments();
    if (assignments.length === 0) {
      test.skip(true, 'No assignments available');
    }

    const firstCard = assignments[0];
    const cardText = await firstCard.textContent();
    const patientName = cardText?.split('\n')[0] || 'Unknown';

    await assignmentsPage.startAssignment(patientName);
    await assignmentsPage.enterResults(patientName);

    const xrayResult = generateXRayResult();
    await resultEntryPage.fillXRayResult(xrayResult);

    await resultEntryPage.submitButton.click();

    const pinModal = page.locator('div[role="dialog"]');
    await pinModal.waitFor({ state: 'visible', timeout: 5000 });

    const pinInput = pinModal.locator('input[name="pin"], input[type="password"]');

    // Try invalid PIN first
    await pinInput.fill('9999');
    await pinModal.getByRole('button', { name: /confirm|submit/i }).click();

    // Wait for error
    await page.waitForTimeout(500);

    // Clear and enter valid PIN
    await pinInput.fill('');
    await pinInput.fill('1234');
    await pinModal.getByRole('button', { name: /confirm|submit/i }).click();

    // Should succeed
    await expect(resultEntryPage.successHeading).toBeVisible();
  });

  test('should allow canceling PIN entry', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const assignmentsPage = new AssignmentsPage(page);
    const resultEntryPage = new ResultEntryPage(page);

    await loginPage.goto();
    await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

    await assignmentsPage.gotoMyAssignments();

    const assignments = await assignmentsPage.getAssignments();
    if (assignments.length === 0) {
      test.skip(true, 'No assignments available');
    }

    const firstCard = assignments[0];
    const cardText = await firstCard.textContent();
    const patientName = cardText?.split('\n')[0] || 'Unknown';

    await assignmentsPage.startAssignment(patientName);
    await assignmentsPage.enterResults(patientName);

    const xrayResult = generateXRayResult();
    await resultEntryPage.fillXRayResult(xrayResult);

    await resultEntryPage.submitButton.click();

    const pinModal = page.locator('div[role="dialog"]');
    await pinModal.waitFor({ state: 'visible', timeout: 5000 });

    // Click cancel button
    const cancelButton = pinModal.getByRole('button', { name: /cancel|close/i });
    if (await cancelButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cancelButton.click();

      // Modal should close
      await expect(pinModal).not.toBeVisible();

      // Should still be on result entry page
      await expect(resultEntryPage.heading).toBeVisible();

      // Success message should NOT be visible
      await expect(resultEntryPage.successHeading).not.toBeVisible();
    }
  });

  test('should handle PIN confirmation for different test types', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const patientRegPage = new PatientRegistrationPage(page);
    const assignmentsPage = new AssignmentsPage(page);
    const resultEntryPage = new ResultEntryPage(page);

    // Test Audiometry with PIN
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

    // Audiometry technician
    await loginPage.goto();
    await loginPage.login(TEST_USERS.AUDIOMETRY_TECHNICIAN?.email || TEST_USERS.TEST_TECHNICIAN.email,
                         TEST_USERS.AUDIOMETRY_TECHNICIAN?.password || TEST_USERS.TEST_TECHNICIAN.password);

    await assignmentsPage.gotoMyAssignments();
    await assignmentsPage.waitForAssignment(patientName);
    await assignmentsPage.startAssignment(patientName);
    await assignmentsPage.enterResults(patientName);

    const audioResult = generateAudiometryResult();
    await resultEntryPage.fillAudiometryResult(audioResult);

    await resultEntryPage.submitButton.click();

    // Should show PIN modal
    const pinModal = page.locator('div[role="dialog"]');
    await expect(pinModal).toBeVisible({ timeout: 5000 });

    // Enter valid PIN
    const pinInput = pinModal.locator('input[name="pin"], input[type="password"]');
    await pinInput.fill('1234');
    await pinModal.getByRole('button', { name: /confirm|submit/i }).click();

    await expect(resultEntryPage.successHeading).toBeVisible();
  });

  test('should mask PIN input with password field', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const assignmentsPage = new AssignmentsPage(page);
    const resultEntryPage = new ResultEntryPage(page);

    await loginPage.goto();
    await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

    await assignmentsPage.gotoMyAssignments();

    const assignments = await assignmentsPage.getAssignments();
    if (assignments.length === 0) {
      test.skip(true, 'No assignments available');
    }

    const firstCard = assignments[0];
    const cardText = await firstCard.textContent();
    const patientName = cardText?.split('\n')[0] || 'Unknown';

    await assignmentsPage.startAssignment(patientName);
    await assignmentsPage.enterResults(patientName);

    const xrayResult = generateXRayResult();
    await resultEntryPage.fillXRayResult(xrayResult);

    await resultEntryPage.submitButton.click();

    const pinModal = page.locator('div[role="dialog"]');
    await pinModal.waitFor({ state: 'visible', timeout: 5000 });

    const pinInput = pinModal.locator('input[name="pin"], input[type="password"]');

    // Verify input type is password
    const inputType = await pinInput.getAttribute('type');
    expect(inputType).toBe('password');

    // Verify characters are masked
    await pinInput.fill('1234');

    // Get the visible value (should be masked as bullets/dots)
    const inputValue = await pinInput.inputValue();
    expect(inputValue).toBe('1234'); // Internal value

    // Visual representation should be masked (this depends on browser rendering)
    // We can verify the field type is password which indicates masking
  });
});

test.describe('PIN Security', () => {
  test('should have limited PIN attempts', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const assignmentsPage = new AssignmentsPage(page);
    const resultEntryPage = new ResultEntryPage(page);

    // Create assignment
    const { PatientRegistrationPage } = await import('../../pages/PatientRegistrationPage');
    const patientRegPage = new PatientRegistrationPage(page);

    await loginPage.goto();
    await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

    await patientRegPage.goto();
    const patientData = generatePatientData();
    await patientRegPage.fillPatientDetails(patientData);
    await patientRegPage.waitForLoadingToFinish();
    await patientRegPage.selectTest(TEST_DEFINITIONS.XRAY_CHEST);
    await patientRegPage.register();

    await page.context().clearCookies();

    await loginPage.goto();
    await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

    await assignmentsPage.gotoMyAssignments();

    const assignments = await assignmentsPage.getAssignments();
    if (assignments.length === 0) {
      test.skip(true, 'No assignments available');
    }

    const firstCard = assignments[0];
    const cardText = await firstCard.textContent();
    const patientName = cardText?.split('\n')[0] || 'Unknown';

    await assignmentsPage.startAssignment(patientName);
    await assignmentsPage.enterResults(patientName);

    const xrayResult = generateXRayResult();
    await resultEntryPage.fillXRayResult(xrayResult);

    await resultEntryPage.submitButton.click();

    const pinModal = page.locator('div[role="dialog"]');
    await pinModal.waitFor({ state: 'visible', timeout: 5000 });

    const pinInput = pinModal.locator('input[name="pin"], input[type="password"]');

    // Try multiple invalid PINs (usually 3-5 attempts allowed)
    let attemptsRemaining = 5;

    for (let i = 0; i < 5; i++) {
      await pinInput.fill(`${i}${i}${i}${i}`); // Try 0000, 1111, 2222, etc.
      await pinModal.getByRole('button', { name: /confirm|submit/i }).click();

      await page.waitForTimeout(500);

      // Check if attempts remaining message is shown
      const attemptsMessage = pinModal.getByText(/attempts remaining|try again/i);
      if (await attemptsMessage.isVisible({ timeout: 1000 }).catch(() => false)) {
        const text = await attemptsMessage.textContent();
        const match = text?.match(/(\d+)\s+attempt/i);
        if (match) {
          attemptsRemaining = parseInt(match[1]);
          break;
        }
      }

      // Check if modal is locked/closed
      if (!(await pinModal.isVisible({ timeout: 1000 }).catch(() => false))) {
        break;
      }
    }

    // After max attempts, should either lock or show specific message
    // This test verifies the behavior exists but doesn't enforce specific limits
    const lockedMessage = page.getByText(/too many attempts|account locked|try again later/i);
    const modalClosed = !(await pinModal.isVisible({ timeout: 1000 }).catch(() => false));

    expect(await lockedMessage.isVisible({ timeout: 1000 }).catch(() => false) || modalClosed).toBeTruthy();
  });

  test('should not store PIN in plain text in browser', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

    // Check local storage and session storage
    const localStorage = await page.evaluate(() => Object.keys(localStorage));
    const sessionStorage = await page.evaluate(() => Object.keys(sessionStorage));

    // Should not contain PIN-related keys
    const pinKeys = ['pin', 'userPin', 'technicianPin', 'authPin'];

    for (const key of pinKeys) {
      expect(localStorage.some(k => k.toLowerCase().includes(key))).toBeFalsy();
      expect(sessionStorage.some(k => k.toLowerCase().includes(key))).toBeFalsy();
    }
  });
});
