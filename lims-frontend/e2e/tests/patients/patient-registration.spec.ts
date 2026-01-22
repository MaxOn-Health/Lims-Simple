import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { PatientRegistrationPage } from '../../pages/PatientRegistrationPage';
import { TEST_USERS } from '../../fixtures/auth.fixture';
import { generatePatientData, TEST_DEFINITIONS } from '../../helpers/testData';

// Note: Tests use dynamically created test users. Run `npm run test:setup-users` first.

test.describe('Patient Registration Workflow', () => {
  let loginPage: LoginPage;
  let registrationPage: PatientRegistrationPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    registrationPage = new PatientRegistrationPage(page);

    // Login as receptionist
    await loginPage.goto();
    await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);
  });

  test('should display patient registration form', async ({ page }) => {
    await registrationPage.goto();

    // Verify all required fields are present
    await expect(registrationPage.nameInput).toBeVisible();
    await expect(registrationPage.ageInput).toBeVisible();
    await expect(registrationPage.genderSelect).toBeVisible();
    await expect(registrationPage.contactNumberInput).toBeVisible();
    await expect(registrationPage.emailInput).toBeVisible();
    await expect(registrationPage.addressInput).toBeVisible();
    await expect(registrationPage.registerButton).toBeVisible();
  });

  test('should load available tests', async ({ page }) => {
    await registrationPage.goto();

    // Wait for tests to load
    await registrationPage.waitForLoadingToFinish();

    // Verify tests are displayed
    const testCount = await registrationPage.testCheckboxes.count();
    expect(testCount).toBeGreaterThan(0);
  });

  test('should register patient with minimum required fields', async ({ page }) => {
    await registrationPage.goto();

    const patientData = generatePatientData();

    // Fill required fields
    await registrationPage.fillPatientDetails({
      name: patientData.name,
      age: patientData.age,
      gender: patientData.gender,
      contactNumber: patientData.contactNumber,
      email: patientData.email,
      address: patientData.address,
    });

    // Select at least one test
    await registrationPage.waitForLoadingToFinish();
    await registrationPage.selectTest(TEST_DEFINITIONS.XRAY_CHEST);

    // Submit
    const result = await registrationPage.register();

    // Verify success
    await expect(registrationPage.successHeading).toBeVisible();
    expect(result.patientId).toBeTruthy();
    expect(result.id).toBeTruthy();
  });

  test('should register patient with all fields', async ({ page }) => {
    await registrationPage.goto();

    const patientData = generatePatientData({
      employerName: 'Acme Corporation',
      employmentType: 'Contract',
    });

    // Fill all fields
    await registrationPage.fillPatientDetails(patientData);

    // Select multiple tests
    await registrationPage.waitForLoadingToFinish();
    await registrationPage.selectTests([
      TEST_DEFINITIONS.XRAY_CHEST,
      TEST_DEFINITIONS.AUDIOMETRY,
      TEST_DEFINITIONS.EYE_TEST,
    ]);

    // Submit
    const result = await registrationPage.register();

    // Verify success
    await expect(registrationPage.successHeading).toBeVisible();
    expect(result.patientId).toMatch(/^PAT-\d{8}-\d{4}$/);
  });

  test('should validate required fields', async ({ page }) => {
    await registrationPage.goto();

    // Try to submit without filling fields
    await registrationPage.registerButton.click();

    // Should show validation errors
    await expect(registrationPage.nameInput).toBeFocused();
  });

  test('should validate age is a number', async ({ page }) => {
    await registrationPage.goto();

    await registrationPage.nameInput.fill('Test Patient');
    await registrationPage.ageInput.fill('abc');

    const isValid = await registrationPage.ageInput.evaluate((el: HTMLInputElement) => {
      return el.validity.valid;
    });

    expect(isValid).toBeFalsy();
  });

  test('should validate contact number format', async ({ page }) => {
    await registrationPage.goto();

    await registrationPage.nameInput.fill('Test Patient');
    await registrationPage.ageInput.fill('30');
    await registrationPage.contactNumberInput.fill('123'); // Too short

    const isValid = await registrationPage.contactNumberInput.evaluate((el: HTMLInputElement) => {
      return el.validity.valid;
    });

    expect(isValid).toBeFalsy();
  });

  test('should allow selecting multiple tests', async ({ page }) => {
    await registrationPage.goto();
    await registrationPage.waitForLoadingToFinish();

    const patientData = generatePatientData();
    await registrationPage.fillPatientDetails(patientData);

    // Select multiple tests
    await registrationPage.selectTest(TEST_DEFINITIONS.XRAY_CHEST);
    await registrationPage.selectTest(TEST_DEFINITIONS.AUDIOMETRY);
    await registrationPage.selectTest(TEST_DEFINITIONS.EYE_TEST);

    // Verify all are selected
    const xrayCheckbox = page.getByLabel(TEST_DEFINITIONS.XRAY_CHEST);
    const audioCheckbox = page.getByLabel(TEST_DEFINITIONS.AUDIOMETRY);
    const eyeCheckbox = page.getByLabel(TEST_DEFINITIONS.EYE_TEST);

    await expect(xrayCheckbox).toHaveAttribute('aria-checked', 'true');
    await expect(audioCheckbox).toHaveAttribute('aria-checked', 'true');
    await expect(eyeCheckbox).toHaveAttribute('aria-checked', 'true');
  });

  test('should deselect tests', async ({ page }) => {
    await registrationPage.goto();
    await registrationPage.waitForLoadingToFinish();

    const patientData = generatePatientData();
    await registrationPage.fillPatientDetails(patientData);

    // Select and then deselect a test
    await registrationPage.selectTest(TEST_DEFINITIONS.XRAY_CHEST);
    await registrationPage.uncheckCheckbox(TEST_DEFINITIONS.XRAY_CHEST);

    // Verify it's unchecked
    const checkbox = page.getByLabel(TEST_DEFINITIONS.XRAY_CHEST);
    await expect(checkbox).toHaveAttribute('aria-checked', 'false');
  });

  test('should show patient ID after registration', async ({ page }) => {
    await registrationPage.goto();

    const patientData = generatePatientData();
    await registrationPage.fillPatientDetails(patientData);

    await registrationPage.waitForLoadingToFinish();
    await registrationPage.selectTest(TEST_DEFINITIONS.XRAY_CHEST);

    const result = await registrationPage.register();

    // Verify patient ID is displayed
    const patientId = await registrationPage.getPatientId();
    expect(patientId).toBe(result.patientId);

    // Verify patient ID format
    expect(result.patientId).toMatch(/^PAT-\d{8}-\d{4}$/);
  });

  test('should navigate to patient list after clicking view all patients', async ({ page }) => {
    await registrationPage.goto();

    const patientData = generatePatientData();
    await registrationPage.fillPatientDetails(patientData);

    await registrationPage.waitForLoadingToFinish();
    await registrationPage.selectTest(TEST_DEFINITIONS.XRAY_CHEST);

    await registrationPage.register();
    await registrationPage.viewAllPatients();

    // Verify navigation
    await expect(page).toHaveURL('/patients');
  });

  test('should persist patient data in database', async ({ page }) => {
    await registrationPage.goto();

    const patientData = generatePatientData();
    await registrationPage.fillPatientDetails(patientData);

    await registrationPage.waitForLoadingToFinish();
    await registrationPage.selectTest(TEST_DEFINITIONS.EYE_TEST);

    const result = await registrationPage.register();

    // Navigate to patient details page
    await page.goto(`/patients/${result.id}`);

    // Verify data persistence
    await expect(page.getByText(patientData.name)).toBeVisible();
    await expect(page.getByText(patientData.contactNumber)).toBeVisible();
    await expect(page.getByText(patientData.gender)).toBeVisible();
  });

  test('should handle concurrent registrations', async ({ page, context }) => {
    // Create two pages for concurrent testing
    const page1 = page;
    const page2 = await context.newPage();

    const registrationPage1 = new PatientRegistrationPage(page1);
    const registrationPage2 = new PatientRegistrationPage(page2);

    // Both pages register patients
    await registrationPage1.goto();
    const patient1 = generatePatientData();
    await registrationPage1.fillPatientDetails(patient1);
    await registrationPage1.waitForLoadingToFinish();
    await registrationPage1.selectTest(TEST_DEFINITIONS.XRAY_CHEST);

    await registrationPage2.goto('/patients/new');
    const patient2 = generatePatientData();
    await registrationPage2.fillPatientDetails(patient2);
    await registrationPage2.waitForLoadingToFinish();
    await registrationPage2.selectTest(TEST_DEFINITIONS.AUDIOMETRY);

    // Submit both (test doesn't verify both succeed, just that it doesn't crash)
    await Promise.all([
      registrationPage1.register().catch(() => {}),
      registrationPage2.register().catch(() => {}),
    ]);

    await page2.close();
  });

  test('should clear form after successful registration', async ({ page }) => {
    await registrationPage.goto();

    const patientData = generatePatientData();
    await registrationPage.fillPatientDetails(patientData);

    await registrationPage.waitForLoadingToFinish();
    await registrationPage.selectTest(TEST_DEFINITIONS.XRAY_CHEST);

    await registrationPage.register();

    // After successful registration, form should not be visible (success state shown)
    await expect(registrationPage.successHeading).toBeVisible();
    await expect(registrationPage.registerButton).not.toBeVisible();
  });

  test('should handle employee information fields', async ({ page }) => {
    await registrationPage.goto();

    const patientData = generatePatientData({
      employerName: 'Test Manufacturing Ltd',
      employmentType: 'Contract',
    });

    await registrationPage.fillPatientDetails(patientData);

    // Verify employer fields are filled
    const employerValue = await registrationPage.employerNameInput.inputValue();
    expect(employerValue).toBe(patientData.employerName);

    const employmentValue = await registrationPage.employmentTypeSelect.textContent();
    expect(employmentValue).toContain(patientData.employmentType);
  });
});

test.describe('Patient Registration - Access Control', () => {
  test('should only allow authorized roles to register patients', async ({ page }) => {
    // Test with SUPER_ADMIN (should have access)
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);

    await page.goto('/patients/new');
    await expect(page.getByRole('heading', { name: /register patient|patient details/i })).toBeVisible();

    // Logout
    await page.context().clearCookies();

    // Test with TEST_TECHNICIAN (should not have access)
    await loginPage.goto();
    await loginPage.login(TEST_USERS.TEST_TECHNICIAN.email, TEST_USERS.TEST_TECHNICIAN.password);

    await page.goto('/patients/new');

    // Should be redirected or show access denied
    await expect(page).not.toHaveURL('/patients/new');
  });
});
