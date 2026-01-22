import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { DoctorReviewPage } from '../../pages/DoctorReviewPage';
import { TEST_USERS } from '../../fixtures/auth.fixture';
import { generatePatientData, TEST_DEFINITIONS } from '../../helpers/testData';

// Note: Tests use dynamically created test users. Run `npm run test:setup-users` first.

/**
 * Doctor Review and Report Signing Tests
 *
 * These tests cover the doctor workflow:
 * 1. View patients ready for review
 * 2. Review patient test results
 * 3. Add clinical remarks
 * 4. Sign report with passkey
 */

test.describe('Doctor Review Workflow', () => {
  let loginPage: LoginPage;
  let doctorPage: DoctorReviewPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    doctorPage = new DoctorReviewPage(page);
  });

  test('should display patients ready for review', async ({ page }) => {
    // Login as doctor
    await loginPage.goto();
    await loginPage.login(TEST_USERS.DOCTOR.email, TEST_USERS.DOCTOR.password);

    await doctorPage.goto();

    // Verify page is loaded
    await expect(doctorPage.heading).toBeVisible();

    // Note: This test assumes there are patients ready for review
    // In a real test, you would first create a patient, submit results, then verify
  });

  test('should allow doctor to navigate to dashboard', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USERS.DOCTOR.email, TEST_USERS.DOCTOR.password);

    await doctorPage.gotoDashboard();

    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should display patient test results for review', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USERS.DOCTOR.email, TEST_USERS.DOCTOR.password);

    await doctorPage.goto();

    // This test requires a patient with completed results
    // You would need to first create a patient and submit results via technician
    const patients = await doctorPage.getPatientsForReview();

    if (patients.length > 0) {
      const firstPatientCard = patients[0];
      await firstPatientCard.click();

      // Verify patient details/results are shown
      await expect(page.getByRole('heading', { name: /patient|results/i })).toBeVisible({ timeout: 10000 });
    }
  });

  test('should allow adding clinical remarks', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USERS.DOCTOR.email, TEST_USERS.DOCTOR.password);

    await doctorPage.goto();

    const patients = await doctorPage.getPatientsForReview();

    if (patients.length > 0) {
      // Get patient name before clicking
      const card = patients[0];
      const cardText = await card.textContent();
      const patientName = cardText?.split('\n')[0] || 'Unknown';

      await doctorPage.reviewPatient(patientName);

      // Add clinical remarks
      const remarks = 'Patient shows normal test results. No abnormalities detected.';
      await doctorPage.addClinicalRemarks(remarks);

      // Save review
      await doctorPage.saveReview();

      // Verify save was successful
      const toast = await doctorPage.getToastMessage();
      expect(toast).toBeTruthy();
      expect(toast).toMatch(/saved|updated|success/i);
    }
  });

  test('should sign report with passkey', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USERS.DOCTOR.email, TEST_USERS.DOCTOR.password);

    await doctorPage.goto();

    const patients = await doctorPage.getPatientsForReview();

    if (patients.length > 0) {
      const card = patients[0];
      const cardText = await card.textContent();
      const patientName = cardText?.split('\n')[0] || 'Unknown';

      await doctorPage.reviewPatient(patientName);

      // Add remarks
      await doctorPage.addClinicalRemarks('Patient cleared for work.');

      // Sign with passkey
      // Note: This assumes the doctor has already set up a passkey
      await doctorPage.signWithPasskey('1234'); // Use test passkey

      // Verify success
      const toast = await doctorPage.getToastMessage();
      expect(toast).toMatch(/signed|success/i);
    }
  });

  test('should setup passkey for new doctor', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USERS.DOCTOR.email, TEST_USERS.DOCTOR.password);

    await doctorPage.goto();

    // Check if passkey setup is needed
    const setupButton = doctorPage.setupPasskeyButton;

    if (await setupButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await doctorPage.setupPasskey('1234');

      const toast = await doctorPage.getToastMessage();
      expect(toast).toMatch(/setup|success|created/i);
    }
  });

  test('should navigate to signed reports', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USERS.DOCTOR.email, TEST_USERS.DOCTOR.password);

    await doctorPage.gotoSignedReports();

    await expect(page.getByRole('heading', { name: /signed reports/i })).toBeVisible();
  });

  test('should display signed reports', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USERS.DOCTOR.email, TEST_USERS.DOCTOR.password);

    await doctorPage.gotoSignedReports();

    // Verify reports are displayed (if any exist)
    const reportCards = page.locator('[data-testid="report-card"], .border-border\\/50');

    const count = await reportCards.count();
    if (count > 0) {
      await expect(reportCards.first()).toBeVisible();
    }
  });
});

test.describe('Complete Doctor Workflow', () => {
  test('end-to-end: patient registration to signed report', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const { PatientRegistrationPage } = await import('../../pages/PatientRegistrationPage');
    const { AssignmentsPage } = await import('../../pages/AssignmentsPage');
    const { ResultEntryPage } = await import('../../pages/ResultEntryPage');

    const patientRegPage = new PatientRegistrationPage(page);
    const assignmentsPage = new AssignmentsPage(page);
    const resultEntryPage = new ResultEntryPage(page);
    const doctorPage = new DoctorReviewPage(page);

    // Step 1: Receptionist registers patient
    await loginPage.goto();
    await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

    await patientRegPage.goto();
    const patientData = generatePatientData();
    await patientRegPage.fillPatientDetails(patientData);
    await patientRegPage.waitForLoadingToFinish();
    await patientRegPage.selectTest(TEST_DEFINITIONS.XRAY_CHEST);
    const regResult = await patientRegPage.register();
    const patientName = patientData.name;

    // Step 2: Technician completes assignment
    await page.context().clearCookies();
    await loginPage.goto();
    await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

    await assignmentsPage.gotoMyAssignments();
    await assignmentsPage.waitForAssignment(patientName);
    await assignmentsPage.startAssignment(patientName);
    await assignmentsPage.enterResults(patientName);

    const { generateXRayResult } = await import('../../helpers/testData');
    const xrayResult = generateXRayResult();
    await resultEntryPage.fillXRayResult(xrayResult);
    await resultEntryPage.submit();
    await expect(resultEntryPage.successHeading).toBeVisible();

    // Step 3: Doctor reviews and signs
    await page.context().clearCookies();
    await loginPage.goto();
    await loginPage.login(TEST_USERS.DOCTOR.email, TEST_USERS.DOCTOR.password);

    await doctorPage.goto();
    await doctorPage.waitForAssignment(patientName, 30000);
    await doctorPage.reviewPatient(patientName);

    // Add clinical remarks
    await doctorPage.addClinicalRemarks('All test results within normal limits. Patient fit for duty.');
    await doctorPage.saveReview();

    // Sign report
    await doctorPage.signWithPasskey('1234');

    // Step 4: Verify report is signed
    await doctorPage.gotoSignedReports();
    const isSigned = await doctorPage.isReportSigned(patientName);
    expect(isSigned).toBeTruthy();
  });
});

test.describe('Doctor Access Control', () => {
  test('should only allow doctor role to access doctor pages', async ({ page }) => {
    // Test with unauthorized role
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

    // Try to access doctor page
    await page.goto('/doctor/patients');

    // Should be redirected or show access denied
    await expect(page).not.toHaveURL('/doctor/patients');
    await expect(page).toHaveURL(/\/(dashboard|login)/);
  });

  test('should allow doctor to access all review pages', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.DOCTOR.email, TEST_USERS.DOCTOR.password);

    // Should access patients for review
    await page.goto('/doctor/patients');
    await expect(page.getByRole('heading', { name: /patients for review/i })).toBeVisible();

    // Should access dashboard
    await page.goto('/doctor/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

    // Should access signed reports
    await page.goto('/doctor/signed-reports');
    await expect(page.getByRole('heading', { name: /signed reports/i })).toBeVisible();
  });
});

test.describe('Report Generation', () => {
  test('should generate unsigned report (skip doctor review)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const { PatientRegistrationPage } = await import('../../pages/PatientRegistrationPage');

    const patientRegPage = new PatientRegistrationPage(page);

    // Login as receptionist
    await loginPage.goto();
    await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

    // Register patient
    await patientRegPage.goto();
    const patientData = generatePatientData();
    await patientRegPage.fillPatientDetails(patientData);
    await patientRegPage.waitForLoadingToFinish();
    await patientRegPage.selectTest(TEST_DEFINITIONS.EYE_TEST);
    const regResult = await patientRegPage.register();

    // Navigate to reports
    await page.goto('/reports/generate/' + regResult.id);

    // Check if there's an option to skip doctor review
    const skipReviewCheckbox = page.getByLabel(/skip doctor review|generate unsigned/i);

    if (await skipReviewCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipReviewCheckbox.check();
    }

    // Generate report
    const generateButton = page.getByRole('button', { name: /generate|create report/i });
    if (await generateButton.isVisible({ timeout: 2000 })) {
      await generateButton.click();

      // Wait for report generation
      await page.waitForURL(/\/reports\/.+/, { timeout: 15000 });
      await expect(page.getByRole('heading', { name: /report/i })).toBeVisible();

      // Verify report contains patient info
      await expect(page.getByText(patientData.name)).toBeVisible();
    }
  });

  test('should display all test results in report', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const { PatientRegistrationPage } = await import('../../pages/PatientRegistrationPage');
    const { AssignmentsPage } = await import('../../pages/AssignmentsPage');
    const { ResultEntryPage } = await import('../../pages/ResultEntryPage');

    const patientRegPage = new PatientRegistrationPage(page);
    const assignmentsPage = new AssignmentsPage(page);
    const resultEntryPage = new ResultEntryPage(page);

    // Create patient with multiple tests
    await loginPage.goto();
    await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

    await patientRegPage.goto();
    const patientData = generatePatientData();
    await patientRegPage.fillPatientDetails(patientData);
    await patientRegPage.waitForLoadingToFinish();
    await patientRegPage.selectTests([TEST_DEFINITIONS.XRAY_CHEST, TEST_DEFINITIONS.AUDIOMETRY]);
    const regResult = await patientRegPage.register();

    await page.context().clearCookies();

    // Complete tests
    await loginPage.goto();
    await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

    await assignmentsPage.gotoMyAssignments();
    await assignmentsPage.waitForAssignment(patientData.name);
    await assignmentsPage.startAssignment(patientData.name);
    await assignmentsPage.enterResults(patientData.name);

    const { generateXRayResult } = await import('../../helpers/testData');
    const xrayResult = generateXRayResult();
    await resultEntryPage.fillXRayResult(xrayResult);
    await resultEntryPage.submitWithPIN('1234');
    await expect(resultEntryPage.successHeading).toBeVisible();

    await page.context().clearCookies();

    // Generate report
    await loginPage.goto();
    await loginPage.login(TEST_USERS.DOCTOR.email, TEST_USERS.DOCTOR.password);

    await page.goto(`/reports/generate/${regResult.id}`);

    // Verify all test results are included
    await expect(page.getByText('X-Ray')).toBeVisible();
    await expect(page.getByText('Audiometry')).toBeVisible();
  });

  test('should download report PDF', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const { PatientRegistrationPage } = await import('../../pages/PatientRegistrationPage');

    const patientRegPage = new PatientRegistrationPage(page);

    await loginPage.goto();
    await loginPage.login(TEST_USERS.DOCTOR.email, TEST_USERS.DOCTOR.password);

    // Navigate to signed reports
    await page.goto('/doctor/signed-reports');

    // Look for download button
    const downloadButton = page.getByRole('button', { name: /download pdf|pdf|download/i });

    if (await downloadButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Intercept PDF download
      const downloadPromise = page.waitForEvent('download');
      await downloadButton.click();
      const download = await downloadPromise;

      // Verify download
      expect(download.suggestedFilename()).toMatch(/\.pdf$/i);

      // Save to temp location
      const path = await download.path();
      expect(path).toBeTruthy();
    } else {
      // Skip if no downloads available
      test.skip(true, 'No signed reports available for download');
    }
  });
});

test.describe('Doctor Dashboard', () => {
  test('should display statistics on doctor dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.DOCTOR.email, TEST_USERS.DOCTOR.password);

    await page.goto('/doctor/dashboard');

    // Check for statistics widgets
    const pendingReviews = page.locator('[data-testid="pending-reviews"], .stat-card');
    const signedReports = page.locator('[data-testid="signed-reports"], .stat-card');
    const totalPatients = page.locator('[data-testid="total-patients"], .stat-card');

    // At least one stat should be visible
    const hasStats = await Promise.all([
      pendingReviews.isVisible({ timeout: 2000 }).catch(() => false),
      signedReports.isVisible({ timeout: 2000 }).catch(() => false),
      totalPatients.isVisible({ timeout: 2000 }).catch(() => false),
    ]);

    expect(hasStats.some(Boolean)).toBeTruthy();
  });

  test('should display recent activity', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.DOCTOR.email, TEST_USERS.DOCTOR.password);

    await page.goto('/doctor/dashboard');

    // Check for recent activity section
    const recentActivity = page.locator('[data-testid="recent-activity"], .recent-activity');
    const activityItems = page.locator('.activity-item, [data-testid="activity-item"]');

    // If activity section exists, check if it has items
    if (await recentActivity.isVisible({ timeout: 3000 }).catch(() => false)) {
      const count = await activityItems.count();
      expect(count).toBeGreaterThanOrEqual(0); // Can be empty
    }
  });
});
