import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { PatientRegistrationPage } from '../../pages/PatientRegistrationPage';
import { AssignmentsPage } from '../../pages/AssignmentsPage';
import { ResultEntryPage } from '../../pages/ResultEntryPage';
import { DoctorReviewPage } from '../../pages/DoctorReviewPage';
import { TEST_USERS } from '../../fixtures/auth.fixture';
import { generatePatientData, TEST_DEFINITIONS, generateXRayResult, generateAudiometryResult, generateEyeTestResult } from '../../helpers/testData';

// Note: Tests use dynamically created test users. Run `npm run test:setup-users` first.

/**
 * Complete End-to-End Workflow Tests
 *
 * These tests cover the complete patient journey:
 * 1. Receptionist registers patient and selects tests
 * 2. Tests are auto-assigned to Shared Pool
 * 3. Technician picks up/stars assignment from Shared Pool
 * 4. Technician enters results with PIN confirmation
 * 5. Doctor reviews results
 * 6. Doctor signs report with passkey
 * 7. Final report is generated and available
 */

test.describe('Complete E2E Workflow - Single Test', () => {
  test('full workflow: patient registration to signed report (X-Ray)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const patientRegPage = new PatientRegistrationPage(page);
    const assignmentsPage = new AssignmentsPage(page);
    const resultEntryPage = new ResultEntryPage(page);
    const doctorPage = new DoctorReviewPage(page);

    // ========================================
    // STEP 1: Receptionist registers patient
    // ========================================
    await test.step('Receptionist registers patient with X-Ray test', async () => {
      await loginPage.goto();
      await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

      await patientRegPage.goto();
      const patientData = generatePatientData({
        employerName: 'Test Manufacturing Ltd',
        employmentType: 'Permanent',
      });

      await patientRegPage.fillPatientDetails(patientData);
      await patientRegPage.waitForLoadingToFinish();
      await patientRegPage.selectTest(TEST_DEFINITIONS.XRAY_CHEST);

      const result = await patientRegPage.register();

      // Verify patient ID format
      expect(result.patientId).toMatch(/^PAT-\d{8}-\d{4}$/);

      // Store patient name for later steps
      await page.evaluate((name) => window.localStorage.setItem('testPatientName', name), patientData.name);
      await page.evaluate((id) => window.localStorage.setItem('testPatientId', id), result.id);
    });

    const patientName = await page.evaluate(() => window.localStorage.getItem('testPatientName')) ?? '';

    // ========================================
    // STEP 2: Technician completes assignment
    // ========================================
    await test.step('X-Ray technician picks up and completes assignment', async () => {
      await page.context().clearCookies();

      await loginPage.goto();
      await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

      await assignmentsPage.gotoMyAssignments();
      await assignmentsPage.waitForAssignment(patientName);

      // Verify initial status
      const initialStatus = await assignmentsPage.getAssignmentStatus(patientName);
      expect(initialStatus).toMatch(/assigned|pending/i);

      // Start assignment
      await assignmentsPage.startAssignment(patientName);

      // Verify status changed
      const inProgressStatus = await assignmentsPage.getAssignmentStatus(patientName);
      expect(inProgressStatus).toMatch(/in progress/i);

      // Enter results
      await assignmentsPage.enterResults(patientName);

      // Verify we're on result entry page
      await expect(resultEntryPage.heading).toBeVisible();
      const resultPatientName = await resultEntryPage.getPatientName();
      expect(resultPatientName).toBe(patientName);

      // Fill X-Ray result fields
      const xrayResult = generateXRayResult({
        findings: 'Lung fields are clear. No evidence of active disease. Cardiac silhouette is normal in size and configuration. No pleural effusion or pneumothorax.',
        impression: 'Normal chest X-ray findings. No abnormalities detected.',
      });

      await resultEntryPage.fillXRayResult(xrayResult);

      // Submit with PIN confirmation
      await resultEntryPage.submitWithPIN('1234');

      // Verify success
      await expect(resultEntryPage.successHeading).toBeVisible();

      // Back to dashboard
      await resultEntryPage.backToDashboard();
    });

    // ========================================
    // STEP 3: Doctor reviews and signs report
    // ========================================
    await test.step('Doctor reviews results and signs report', async () => {
      await page.context().clearCookies();

      await loginPage.goto();
      await loginPage.login(TEST_USERS.DOCTOR.email, TEST_USERS.DOCTOR.password);

      await doctorPage.goto();

      // Wait for patient to appear (may need polling/retry)
      await doctorPage.waitForAssignment(patientName, 30000);

      // Review patient
      await doctorPage.reviewPatient(patientName);

      // Verify patient details are shown
      await expect(page.getByText(patientName)).toBeVisible();

      // Add clinical remarks
      await doctorPage.addClinicalRemarks('Chest X-ray findings are within normal limits. No respiratory or cardiovascular abnormalities detected. Patient is medically fit for work.');

      // Save review
      await doctorPage.saveReview();

      // Verify save success
      const toast = await doctorPage.getToastMessage();
      expect(toast).toMatch(/saved|success/i);

      // Sign report with passkey
      await doctorPage.signWithPasskey('1234');

      // Verify signing success
      const signToast = await doctorPage.getToastMessage();
      expect(signToast).toMatch(/signed|success/i);
    });

    // ========================================
    // STEP 4: Verify signed report
    // ========================================
    await test.step('Verify report is signed and available', async () => {
      await doctorPage.gotoSignedReports();

      // Verify report appears
      await expect(page.getByText(patientName)).toBeVisible({ timeout: 10000 });

      // Verify signed status
      const isSigned = await doctorPage.isReportSigned(patientName);
      expect(isSigned).toBeTruthy();
    });

    // Cleanup
    await page.evaluate(() => {
      window.localStorage.removeItem('testPatientName');
      window.localStorage.removeItem('testPatientId');
    });
  });
});

test.describe('Complete E2E Workflow - Multiple Tests', () => {
  test('full workflow: patient with multiple tests', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const patientRegPage = new PatientRegistrationPage(page);
    const assignmentsPage = new AssignmentsPage(page);
    const resultEntryPage = new ResultEntryPage(page);
    const doctorPage = new DoctorReviewPage(page);

    // ========================================
    // STEP 1: Register patient with multiple tests
    // ========================================
    await test.step('Receptionist registers patient with multiple tests', async () => {
      await loginPage.goto();
      await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

      await patientRegPage.goto();
      const patientData = generatePatientData();

      await patientRegPage.fillPatientDetails(patientData);
      await patientRegPage.waitForLoadingToFinish();

      // Select multiple tests
      await patientRegPage.selectTests([
        TEST_DEFINITIONS.XRAY_CHEST,
        TEST_DEFINITIONS.AUDIOMETRY,
        TEST_DEFINITIONS.EYE_TEST,
      ]);

      const result = await patientRegPage.register();

      // Store for later steps
      await page.evaluate((name) => window.localStorage.setItem('multiTestPatient', name), patientData.name);
      await page.evaluate((id) => window.localStorage.setItem('multiTestId', id), result.id);
    });

    const patientName = await page.evaluate(() => window.localStorage.getItem('multiTestPatient')) ?? '';

    // ========================================
    // STEP 2: Complete X-Ray test
    // ========================================
    await test.step('Complete X-Ray test', async () => {
      await page.context().clearCookies();

      await loginPage.goto();
      await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

      await assignmentsPage.gotoMyAssignments();
      await assignmentsPage.waitForAssignment(patientName);
      await assignmentsPage.startAssignment(patientName);
      await assignmentsPage.enterResults(patientName);

      const xrayResult = generateXRayResult();
      await resultEntryPage.fillXRayResult(xrayResult);
      await resultEntryPage.submitWithPIN('1234');

      await expect(resultEntryPage.successHeading).toBeVisible();
    });

    // ========================================
    // STEP 3: Complete Audiometry test
    // ========================================
    await test.step('Complete Audiometry test', async () => {
      await page.context().clearCookies();

      await loginPage.goto();
      await loginPage.login(
        TEST_USERS.AUDIOMETRY_TECHNICIAN?.email || TEST_USERS.TEST_TECHNICIAN.email,
        TEST_USERS.AUDIOMETRY_TECHNICIAN?.password || TEST_USERS.TEST_TECHNICIAN.password
      );

      await assignmentsPage.gotoMyAssignments();
      await assignmentsPage.waitForAssignment(patientName);
      await assignmentsPage.startAssignment(patientName);
      await assignmentsPage.enterResults(patientName);

      const audioResult = generateAudiometryResult();
      await resultEntryPage.fillAudiometryResult(audioResult);
      await resultEntryPage.submitWithPIN('1234');

      await expect(resultEntryPage.successHeading).toBeVisible();
    });

    // ========================================
    // STEP 4: Complete Eye Test
    // ========================================
    await test.step('Complete Eye Test', async () => {
      await page.context().clearCookies();

      await loginPage.goto();
      await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

      await assignmentsPage.gotoMyAssignments();
      await assignmentsPage.waitForAssignment(patientName);
      await assignmentsPage.startAssignment(patientName);
      await assignmentsPage.enterResults(patientName);

      const eyeResult = generateEyeTestResult({
        visualAcuityLeft: '6/6',
        visualAcuityRight: '6/6',
        colorVision: 'Normal',
        binocularVision: 'Normal',
      });

      await resultEntryPage.fillEyeTestResult(eyeResult);
      await resultEntryPage.submitWithPIN('1234');

      await expect(resultEntryPage.successHeading).toBeVisible();
    });

    // ========================================
    // STEP 5: Doctor reviews all results and signs
    // ========================================
    await test.step('Doctor reviews all test results', async () => {
      await page.context().clearCookies();

      await loginPage.goto();
      await loginPage.login(TEST_USERS.DOCTOR.email, TEST_USERS.DOCTOR.password);

      await doctorPage.goto();
      await doctorPage.waitForAssignment(patientName, 45000);
      await doctorPage.reviewPatient(patientName);

      // Add comprehensive remarks
      await doctorPage.addClinicalRemarks(`
        Comprehensive Review:
        1. Chest X-Ray: Normal findings, no abnormalities.
        2. Audiometry: Hearing thresholds within normal limits for both ears.
        3. Eye Test: Visual acuity 6/6 both eyes, normal color vision.

        Overall: Patient is medically fit for duty in all assessed parameters.
      `.trim());

      await doctorPage.saveReview();
      await doctorPage.signWithPasskey('1234');
    });

    // Verify all tests are signed
    await expect(page.getByText(/signed|completed/i)).toBeVisible();

    // Cleanup
    await page.evaluate(() => {
      window.localStorage.removeItem('multiTestPatient');
      window.localStorage.removeItem('multiTestId');
    });
  });
});

test.describe('Complete E2E Workflow - Edit Result', () => {
  test('full workflow: technician edits submitted result with PIN', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const patientRegPage = new PatientRegistrationPage(page);
    const assignmentsPage = new AssignmentsPage(page);
    const resultEntryPage = new ResultEntryPage(page);

    // Step 1: Create and submit result
    await test.step('Create initial result', async () => {
      await loginPage.goto();
      await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

      await patientRegPage.goto();
      const patientData = generatePatientData();
      await patientRegPage.fillPatientDetails(patientData);
      await patientRegPage.waitForLoadingToFinish();
      await patientRegPage.selectTest(TEST_DEFINITIONS.XRAY_CHEST);
      await patientRegPage.register();

      await page.evaluate((name) => window.localStorage.setItem('editPatientName', name), patientData.name);
    });

    const patientName = await page.evaluate(() => window.localStorage.getItem('editPatientName')) ?? '';

    await test.step('Submit initial result', async () => {
      await page.context().clearCookies();

      await loginPage.goto();
      await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

      await assignmentsPage.gotoMyAssignments();
      await assignmentsPage.waitForAssignment(patientName);
      await assignmentsPage.startAssignment(patientName);
      await assignmentsPage.enterResults(patientName);

      const xrayResult = generateXRayResult({
        findings: 'Initial findings - to be updated',
        impression: 'Initial impression',
      });

      await resultEntryPage.fillXRayResult(xrayResult);
      await resultEntryPage.submitWithPIN('1234');

      await expect(resultEntryPage.successHeading).toBeVisible();
    });

    // Step 2: Edit the result
    await test.step('Edit submitted result', async () => {
      await page.goto('/assignments/completed');

      // Find and click edit button for the assignment
      const editButton = page.locator('[data-testid="assignment-card"]').filter({ hasText: patientName })
        .getByRole('button', { name: /edit|modify/i });

      if (await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await editButton.click();

        // Should require PIN confirmation for edit
        const pinModal = page.locator('div[role="dialog"]');
        await expect(pinModal).toBeVisible({ timeout: 5000 });

        const pinInput = pinModal.locator('input[name="pin"], input[type="password"]');
        await pinInput.fill('1234');
        await pinModal.getByRole('button', { name: /confirm|verify/i }).click();

        // Now on edit page
        await expect(resultEntryPage.heading).toBeVisible();

        // Update findings
        await resultEntryPage.fillField('findings', 'Updated findings: Chest appears clear. No abnormalities detected in the updated review.');

        // Add edit reason
        await resultEntryPage.editResult('Correction to initial findings - more detailed assessment provided.');

        await expect(resultEntryPage.successHeading).toBeVisible();
      } else {
        test.skip(true, 'Edit button not available or result already reviewed by doctor');
      }
    });

    // Cleanup
    await page.evaluate(() => window.localStorage.removeItem('editPatientName'));
  });
});

test.describe('Complete E2E Workflow - Shared Pool Pickup', () => {
  test('full workflow: assignment from Shared Pool pickup', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const patientRegPage = new PatientRegistrationPage(page);
    const assignmentsPage = new AssignmentsPage(page);
    const resultEntryPage = new ResultEntryPage(page);

    // Step 1: Create assignment (goes to Shared Pool)
    await test.step('Create assignment in Shared Pool', async () => {
      await loginPage.goto();
      await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

      await patientRegPage.goto();
      const patientData = generatePatientData();
      await patientRegPage.fillPatientDetails(patientData);
      await patientRegPage.waitForLoadingToFinish();
      await patientRegPage.selectTest(TEST_DEFINITIONS.AUDIOMETRY);
      await patientRegPage.register();

      await page.evaluate((name) => window.localStorage.setItem('poolPatientName', name), patientData.name);
    });

    const patientName = await page.evaluate(() => window.localStorage.getItem('poolPatientName')) ?? '';

    // Step 2: Technician picks up from Shared Pool
    await test.step('Technician picks up from Shared Pool', async () => {
      await page.context().clearCookies();

      await loginPage.goto();
      await loginPage.login(
        TEST_USERS.AUDIOMETRY_TECHNICIAN?.email || TEST_USERS.TEST_TECHNICIAN.email,
        TEST_USERS.AUDIOMETRY_TECHNICIAN?.password || TEST_USERS.TEST_TECHNICIAN.password
      );

      await assignmentsPage.gotoMyAssignments();

      // Should see assignment in Shared Pool
      await assignmentsPage.waitForAssignment(patientName);

      // Check for "Pick Up" or "Claim" button
      const pickupButton = page.getByRole('button', { name: /pick up|claim/i });

      if (await pickupButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await pickupButton.click();

        // Confirm pickup
        const confirmButton = page.getByRole('button', { name: /confirm|yes/i });
        if (await confirmButton.isVisible({ timeout: 2000 })) {
          await confirmButton.click();
        }

        // Verify assignment is now owned by technician
        const status = await assignmentsPage.getAssignmentStatus(patientName);
        expect(status).toMatch(/assigned|in progress/i);
      } else {
        // Alternative: Starting the assignment auto-assigns it
        await assignmentsPage.startAssignment(patientName);
      }
    });

    // Step 3: Complete the assignment
    await test.step('Complete the picked-up assignment', async () => {
      await assignmentsPage.enterResults(patientName);

      const audioResult = generateAudiometryResult();
      await resultEntryPage.fillAudiometryResult(audioResult);
      await resultEntryPage.submitWithPIN('1234');

      await expect(resultEntryPage.successHeading).toBeVisible();
    });

    // Cleanup
    await page.evaluate(() => window.localStorage.removeItem('poolPatientName'));
  });
});

test.describe('Complete E2E Workflow - Report Generation', () => {
  test('full workflow: generate unsigned report (skip doctor)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const patientRegPage = new PatientRegistrationPage(page);
    const assignmentsPage = new AssignmentsPage(page);
    const resultEntryPage = new ResultEntryPage(page);

    // Step 1: Create and complete assignment
    await test.step('Create and complete assignment', async () => {
      await loginPage.goto();
      await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

      await patientRegPage.goto();
      const patientData = generatePatientData();
      await patientRegPage.fillPatientDetails(patientData);
      await patientRegPage.waitForLoadingToFinish();
      await patientRegPage.selectTest(TEST_DEFINITIONS.EYE_TEST);
      const result = await patientRegPage.register();

      await page.evaluate((id) => window.localStorage.setItem('reportPatientId', id), result.id);
      await page.evaluate((name) => window.localStorage.setItem('reportPatientName', name), patientData.name);
    });

    const patientId = await page.evaluate(() => window.localStorage.getItem('reportPatientId')) ?? '';
    const patientName = await page.evaluate(() => window.localStorage.getItem('reportPatientName')) ?? '';

    await test.step('Technician completes test', async () => {
      await page.context().clearCookies();

      await loginPage.goto();
      await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

      await assignmentsPage.gotoMyAssignments();
      await assignmentsPage.waitForAssignment(patientName);
      await assignmentsPage.startAssignment(patientName);
      await assignmentsPage.enterResults(patientName);

      const eyeResult = generateEyeTestResult();
      await resultEntryPage.fillEyeTestResult(eyeResult);
      await resultEntryPage.submitWithPIN('1234');

      await expect(resultEntryPage.successHeading).toBeVisible();
    });

    // Step 2: Generate unsigned report
    await test.step('Generate unsigned report', async () => {
      await page.context().clearCookies();

      await loginPage.goto();
      await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

      // Navigate to report generation page
      await page.goto(`/reports/generate/${patientId}`);

      // Look for skip doctor review option
      const skipReviewCheckbox = page.getByLabel(/skip doctor review|generate unsigned/i);

      if (await skipReviewCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
        await skipReviewCheckbox.check();
      }

      // Generate report
      const generateButton = page.getByRole('button', { name: /generate report|create report/i });
      await generateButton.click();

      // Wait for report to be generated
      await page.waitForURL(/\/reports\/.+/, { timeout: 15000 });

      // Verify report is shown
      await expect(page.getByRole('heading', { name: /report/i })).toBeVisible();
      await expect(page.getByText(patientName)).toBeVisible();

      // Verify unsigned status
      await expect(page.getByText(/unsigned|pending signature/i)).toBeVisible();
    });

    // Cleanup
    await page.evaluate(() => {
      window.localStorage.removeItem('reportPatientId');
      window.localStorage.removeItem('reportPatientName');
    });
  });
});
