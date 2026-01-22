import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Patient Registration Page Object Model
 */
export class PatientRegistrationPage extends BasePage {
  // Form locators
  readonly nameInput: Locator;
  readonly ageInput: Locator;
  readonly genderSelect: Locator;
  readonly contactNumberInput: Locator;
  readonly emailInput: Locator;
  readonly addressInput: Locator;
  readonly employerNameInput: Locator;
  readonly employmentTypeSelect: Locator;

  // Test selection
  readonly testCheckboxes: Locator;
  readonly packageSelect: Locator;

  // Action buttons
  readonly registerButton: Locator;
  readonly cancelButton: Locator;

  // Success state
  readonly successHeading: Locator;
  readonly patientIdDisplay: Locator;
  readonly viewAllPatientsButton: Locator;

  constructor(page: Page) {
    super(page);

    // Patient detail fields
    this.nameInput = page.locator('input[name="name"]');
    this.ageInput = page.locator('input[name="age"]');
    this.genderSelect = page.locator('#gender');
    this.contactNumberInput = page.locator('input[name="contactNumber"]');
    this.emailInput = page.locator('input[name="email"]');
    this.addressInput = page.locator('textarea[name="address"]');
    this.employerNameInput = page.locator('input[name="employerName"]');
    this.employmentTypeSelect = page.locator('#employmentType');

    // Test selection
    this.testCheckboxes = page.locator('button[role="checkbox"][id^="test-"]');
    this.packageSelect = page.locator('#package');

    // Buttons
    this.registerButton = page.getByRole('button', { name: 'Register Patient' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });

    // Success state
    this.successHeading = page.getByRole('heading', { name: 'Patient Registered Successfully' });
    this.patientIdDisplay = page.locator('[data-testid="patient-id"]');
    this.viewAllPatientsButton = page.getByRole('button', { name: 'View All Patients' });
  }

  /**
   * Navigate to patient registration page
   */
  async goto() {
    await this.page.goto('/patients/new');
    // Wait for form to be ready
    await this.nameInput.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Fill patient details
   */
  async fillPatientDetails(data: {
    name: string;
    age: string | number;
    gender: string;
    contactNumber: string;
    email?: string;
    address?: string;
    employerName?: string;
    employmentType?: string;
  }) {
    await this.nameInput.fill(data.name);
    await this.ageInput.fill(String(data.age));

    // Select gender using Shadcn Select
    await this.genderSelect.click();
    await this.page.getByRole('listbox').waitFor({ state: 'visible' });
    await this.page.keyboard.type(data.gender);
    await this.page.keyboard.press('Enter');

    await this.contactNumberInput.fill(data.contactNumber);

    if (data.email) {
      await this.emailInput.fill(data.email);
    }

    if (data.address) {
      await this.addressInput.fill(data.address);
    }

    if (data.employerName) {
      await this.employerNameInput.fill(data.employerName);
    }

    if (data.employmentType) {
      await this.employmentTypeSelect.click();
      await this.page.getByRole('listbox').waitFor({ state: 'visible' });
      await this.page.keyboard.type(data.employmentType);
      await this.page.keyboard.press('Enter');
    }
  }

  /**
   * Select a test by name
   */
  async selectTest(testName: string) {
    // Wait for loading to finish
    await this.waitForLoadingToFinish();

    // Find checkbox by label
    const checkbox = this.page.getByLabel(testName);
    await checkbox.waitFor({ state: 'visible', timeout: 10000 });
    await checkbox.click();

    // Verify checked
    await expect(checkbox).toHaveAttribute('aria-checked', 'true');
  }

  /**
   * Select multiple tests
   */
  async selectTests(testNames: string[]) {
    for (const testName of testNames) {
      await this.selectTest(testName);
    }
  }

  /**
   * Select a package
   */
  async selectPackage(packageName: string) {
    await this.packageSelect.click();
    await this.page.getByRole('listbox').waitFor({ state: 'visible' });
    await this.page.keyboard.type(packageName);
    await this.page.keyboard.press('Enter');
  }

  /**
   * Register patient and wait for response
   * Returns the response data
   */
  async register(): Promise<{ patientId: string; id: string }> {
    // Wait for API response
    const responsePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes('/patients/register') && response.request().method() === 'POST',
      { timeout: 30000 }
    );

    await this.registerButton.click();

    const response = await responsePromise;
    const data = await response.json();

    // Wait for success heading
    await this.successHeading.waitFor({ state: 'visible', timeout: 15000 });

    return {
      patientId: data.patientId,
      id: data.id,
    };
  }

  /**
   * Check if registration was successful
   */
  async isRegistrationSuccessful(): Promise<boolean> {
    return await this.successHeading.isVisible({ timeout: 10000 });
  }

  /**
   * Get the generated patient ID
   */
  async getPatientId(): Promise<string | null> {
    try {
      return await this.patientIdDisplay.textContent({ timeout: 5000 });
    } catch {
      return null;
    }
  }

  /**
   * Click "View All Patients" button
   */
  async viewAllPatients() {
    await this.viewAllPatientsButton.click();
    await this.page.waitForURL('/patients', { timeout: 10000 });
  }
}

/**
 * Helper for expect in page objects
 */
async function expect(locator: Locator) {
  const { expect } = await import('@playwright/test');
  return expect(locator);
}
