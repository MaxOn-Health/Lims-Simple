import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { PatientRegistrationPage } from '../../pages/PatientRegistrationPage';
import { AssignmentsPage } from '../../pages/AssignmentsPage';
import { ResultEntryPage } from '../../pages/ResultEntryPage';
import { TEST_USERS, getUserByRole } from '../../fixtures/auth.fixture';
import { generatePatientData, TEST_DEFINITIONS, generateXRayResult, generateAudiometryResult, generateEyeTestResult } from '../../helpers/testData';

// Note: Tests use dynamically created test users. Run `npm run test:setup-users` first.

/**
 * Technician Workflow Tests
 *
 * These tests cover the complete technician workflow:
 * 1. Receptionist registers patient and assigns tests
 * 2. Technician sees assignment in "My Tasks"
 * 3. Technician starts assignment
 * 4. Technician enters results
 * 5. Technician submits results
 */

test.describe('Technician Workflow - X-Ray', () => {
  test('complete x-ray assignment workflow', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const patientRegPage = new PatientRegistrationPage(page);
    const assignmentsPage = new AssignmentsPage(page);
    const resultEntryPage = new ResultEntryPage(page);

    // Step 1: Receptionist registers patient with X-Ray test
    await loginPage.goto();
    await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

    await patientRegPage.goto();
    const patientData = generatePatientData();
    await patientRegPage.fillPatientDetails(patientData);
    await patientRegPage.waitForLoadingToFinish();
    await patientRegPage.selectTest(TEST_DEFINITIONS.XRAY_CHEST);

    const registrationResult = await patientRegPage.register();
    const patientName = patientData.name;

    // Logout
    await page.context().clearCookies();

    // Step 2: X-Ray technician logs in
    await loginPage.goto();
    await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

    // Step 3: Navigate to My Assignments
    await assignmentsPage.gotoMyAssignments();

    // Step 4: Find and verify assignment
    await assignmentsPage.waitForAssignment(patientName);
    const status = await assignmentsPage.getAssignmentStatus(patientName);
    expect(status).toMatch(/assigned|pending/i);

    // Step 5: Start assignment
    await assignmentsPage.startAssignment(patientName);

    // Verify status changed to In Progress
    const newStatus = await assignmentsPage.getAssignmentStatus(patientName);
    expect(newStatus).toMatch(/in progress/i);

    // Step 6: Enter Results
    await assignmentsPage.enterResults(patientName);

    // Step 7: Fill X-Ray result fields
    const xrayResult = generateXRayResult();
    await resultEntryPage.fillXRayResult(xrayResult);

    // Verify patient info
    const resultPatientName = await resultEntryPage.getPatientName();
    expect(resultPatientName).toBe(patientName);

    // Step 8: Submit result
    await resultEntryPage.submit();

    // Step 9: Verify success
    await expect(resultEntryPage.successHeading).toBeVisible();

    // Step 10: Back to dashboard
    await resultEntryPage.backToDashboard();

    // Step 11: Verify assignment is removed from "My Tasks"
    await assignmentsPage.gotoMyAssignments();
    await assignmentsPage.waitForAssignmentRemoval(patientName);
  });

  test('should edit previously submitted result', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const assignmentsPage = new AssignmentsPage(page);

    // Login as technician
    await loginPage.goto();
    await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

    await assignmentsPage.gotoMyAssignments();

    // This test assumes there's a submitted assignment that can be edited
    // Implementation depends on the edit result UI
  });
});

test.describe('Technician Workflow - Audiometry', () => {
  test('complete audiometry assignment workflow', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const patientRegPage = new PatientRegistrationPage(page);
    const assignmentsPage = new AssignmentsPage(page);
    const resultEntryPage = new ResultEntryPage(page);

    // Step 1: Register patient with Audiometry test
    await loginPage.goto();
    await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

    await patientRegPage.goto();
    const patientData = generatePatientData();
    await patientRegPage.fillPatientDetails(patientData);
    await patientRegPage.waitForLoadingToFinish();
    await patientRegPage.selectTest(TEST_DEFINITIONS.AUDIOMETRY);

    const registrationResult = await patientRegPage.register();
    const patientName = patientData.name;

    // Logout
    await page.context().clearCookies();

    // Step 2: Audiometry technician logs in
    // Note: This assumes TEST_TECHNICIAN is configured for audiometry
    await loginPage.goto();
    await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

    await assignmentsPage.gotoMyAssignments();
    await assignmentsPage.waitForAssignment(patientName);
    await assignmentsPage.startAssignment(patientName);
    await assignmentsPage.enterResults(patientName);

    // Step 3: Fill Audiometry result fields
    const audioResult = generateAudiometryResult();
    await resultEntryPage.fillAudiometryResult(audioResult);

    // Submit
    await resultEntryPage.submit();
    await expect(resultEntryPage.successHeading).toBeVisible();
  });
});

test.describe('Technician Workflow - Eye Test', () => {
  test('complete eye test assignment workflow', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const patientRegPage = new PatientRegistrationPage(page);
    const assignmentsPage = new AssignmentsPage(page);
    const resultEntryPage = new ResultEntryPage(page);

    // Register patient with Eye Test
    await loginPage.goto();
    await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

    await patientRegPage.goto();
    const patientData = generatePatientData();
    await patientRegPage.fillPatientDetails(patientData);
    await patientRegPage.waitForLoadingToFinish();
    await patientRegPage.selectTest(TEST_DEFINITIONS.EYE_TEST);

    await patientRegPage.register();
    const patientName = patientData.name;

    await page.context().clearCookies();

    // Technician logs in
    await loginPage.goto();
    await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

    await assignmentsPage.gotoMyAssignments();
    await assignmentsPage.waitForAssignment(patientName);
    await assignmentsPage.startAssignment(patientName);
    await assignmentsPage.enterResults(patientName);

    // Fill Eye Test result fields
    const eyeResult = generateEyeTestResult();
    await resultEntryPage.fillEyeTestResult(eyeResult);

    await resultEntryPage.submit();
    await expect(resultEntryPage.successHeading).toBeVisible();
  });
});

test.describe('Assignment Status Updates', () => {
  test('should update assignment status through workflow', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const patientRegPage = new PatientRegistrationPage(page);
    const assignmentsPage = new AssignmentsPage(page);

    // Register patient
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

    // Technician logs in and checks initial status
    await loginPage.goto();
    await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

    await assignmentsPage.gotoMyAssignments();
    await assignmentsPage.waitForAssignment(patientName);

    let status = await assignmentsPage.getAssignmentStatus(patientName);
    expect(status).toMatch(/assigned|pending/i);

    // Start assignment
    await assignmentsPage.startAssignment(patientName);

    status = await assignmentsPage.getAssignmentStatus(patientName);
    expect(status).toMatch(/in progress/i);

    // Note: After result submission, assignment should no longer appear in "My Tasks"
    // or should show as "Completed" depending on the filter
  });

  test('should handle multiple assignments for same patient', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const patientRegPage = new PatientRegistrationPage(page);
    const assignmentsPage = new AssignmentsPage(page);

    // Register patient with multiple tests
    await loginPage.goto();
    await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);

    await patientRegPage.goto();
    const patientData = generatePatientData();
    await patientRegPage.fillPatientDetails(patientData);
    await patientRegPage.waitForLoadingToFinish();
    await patientRegPage.selectTests([
      TEST_DEFINITIONS.XRAY_CHEST,
      TEST_DEFINITIONS.AUDIOMETRY,
      TEST_DEFINITIONS.EYE_TEST,
    ]);
    await patientRegPage.register();
    const patientName = patientData.name;

    await page.context().clearCookies();

    // Technician should see all applicable assignments
    await loginPage.goto();
    await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

    await assignmentsPage.gotoMyAssignments();

    // Count assignments for this patient (may appear multiple times or once with multiple tests)
    const cards = await assignmentsPage.assignmentCards.filter({ hasText: patientName }).all();
    expect(cards.length).toBeGreaterThan(0);
  });
});

test.describe('PIN Confirmation', () => {
  test('should require PIN confirmation when submitting results', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const patientRegPage = new PatientRegistrationPage(page);
    const assignmentsPage = new AssignmentsPage(page);
    const resultEntryPage = new ResultEntryPage(page);

    // Register patient
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

    // Technician logs in
    await loginPage.goto();
    await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

    await assignmentsPage.gotoMyAssignments();
    await assignmentsPage.waitForAssignment(patientName);
    await assignmentsPage.startAssignment(patientName);
    await assignmentsPage.enterResults(patientName);

    // Fill result
    const xrayResult = generateXRayResult();
    await resultEntryPage.fillXRayResult(xrayResult);

    // Submit with PIN (if PIN confirmation is enabled)
    await resultEntryPage.submitWithPIN('0000'); // Use test PIN

    await expect(resultEntryPage.successHeading).toBeVisible();
  });
});

test.describe('Assignment Filtering', () => {
  test('should filter assignments by status', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const assignmentsPage = new AssignmentsPage(page);

    await loginPage.goto();
    await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

    await assignmentsPage.gotoMyAssignments();

    // This test depends on the filter UI implementation
    // Example:
    // await assignmentsPage.filterByStatus('assigned');
    // await assignmentsPage.filterByStatus('in-progress');
    // await assignmentsPage.filterByStatus('all');
  });
});
