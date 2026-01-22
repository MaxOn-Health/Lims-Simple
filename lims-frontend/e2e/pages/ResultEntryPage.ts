import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Result Entry Page Object Model
 * Handles dynamic result forms for different test types
 */
export class ResultEntryPage extends BasePage {
  // Page elements
  readonly heading: Locator;
  readonly patientInfo: Locator;
  readonly testInfo: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly backButton: Locator;

  // Success modal
  readonly successHeading: Locator;
  readonly successMessage: Locator;
  readonly backToDashboardButton: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.getByRole('heading', { name: 'Enter Test Results' });
    this.patientInfo = page.locator('[data-testid="patient-info"]');
    this.testInfo = page.locator('[data-testid="test-info"]');

    this.submitButton = page.getByRole('button', { name: 'Submit Result' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    this.backButton = page.getByRole('button', { name: 'Back' });

    this.successHeading = page.getByRole('heading', { name: 'Result Submitted!' });
    this.successMessage = page.locator('[data-testid="success-message"]');
    this.backToDashboardButton = page.getByRole('button', { name: 'Back to Dashboard' });
  }

  /**
   * Navigate directly to result entry page for an assignment
   */
  async goto(assignmentId: string) {
    await this.page.goto(`/results/entry/${assignmentId}`);
    await this.heading.waitFor({ state: 'visible', timeout: 15000 });
  }

  /**
   * Get a field by its name
   * Fields are rendered with id="field-{name}"
   */
  getField(fieldName: string): Locator {
    return this.page.locator(`#field-${fieldName}`);
  }

  /**
   * Fill a text field
   */
  async fillField(fieldName: string, value: string) {
    const field = this.getField(fieldName);
    await field.waitFor({ state: 'visible', timeout: 5000 });

    const tag = await field.evaluate((el) => el.tagName.toLowerCase());

    if (tag === 'input' || tag === 'textarea') {
      await field.fill(value);
    } else if (tag === 'select') {
      await field.selectOption(value);
    }
  }

  /**
   * Fill multiple fields
   */
  async fillFields(fields: Record<string, string>) {
    for (const [fieldName, value] of Object.entries(fields)) {
      await this.fillField(fieldName, value);
    }
  }

  /**
   * Select a radio option
   */
  async selectRadio(fieldName: string, value: string) {
    const radio = this.page.locator(`input[name="${fieldName}"][value="${value}"]`);
    await radio.waitFor({ state: 'visible', timeout: 5000 });
    await radio.check();
  }

  /**
   * Select a checkbox option
   */
  async selectCheckbox(fieldName: string, value: string) {
    const checkbox = this.page.locator(`input[name="${fieldName}"][value="${value}"]`);
    await checkbox.waitFor({ state: 'visible', timeout: 5000 });
    await checkbox.check();
  }

  /**
   * Fill X-Ray Chest result fields
   */
  async fillXRayResult(data: {
    findings: string;
    impression: string;
  }) {
    await this.fillFields({
      findings: data.findings,
      impression: data.impression,
    });
  }

  /**
   * Fill Audiometry result fields
   * Audiometry has 22 frequency fields for left/right ears
   */
  async fillAudiometryResult(data: {
    frequencies?: Record<string, { left: string; right: string }>;
  }) {
    if (data.frequencies) {
      for (const [freq, values] of Object.entries(data.frequencies)) {
        await this.fillField(`${freq}_left`, values.left);
        await this.fillField(`${freq}_right`, values.right);
      }
    }
  }

  /**
   * Fill Eye Test result fields
   */
  async fillEyeTestResult(data: {
    [key: string]: string;
  }) {
    await this.fillFields(data);
  }

  /**
   * Fill Blood Test result fields
   */
  async fillBloodTestResult(data: {
    [key: string]: string;
  }) {
    await this.fillFields(data);
  }

  /**
   * Submit result and wait for response
   */
  async submit(): Promise<void> {
    // Wait for API response
    const responsePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes('/results/submit') && response.status() === 201,
      { timeout: 30000 }
    );

    await this.submitButton.click();

    await responsePromise;
  }

  /**
   * Submit result with PIN confirmation
   */
  async submitWithPIN(pin: string): Promise<void> {
    // Click submit - should trigger PIN modal
    await this.submitButton.click();

    // Handle PIN modal
    const pinModal = this.page.locator('div[role="dialog"]');
    await pinModal.waitFor({ state: 'visible', timeout: 5000 });

    // Enter PIN (4 digits)
    const pinInput = pinModal.locator('input[name="pin"], input[type="password"]');
    await pinInput.fill(pin);

    // Confirm
    await pinModal.getByRole('button', { name: 'Confirm' }).click();

    // Wait for success
    await this.successHeading.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Check if submission was successful
   */
  async isSubmissionSuccessful(): Promise<boolean> {
    return await this.successHeading.isVisible({ timeout: 10000 });
  }

  /**
   * Navigate back to dashboard after success
   */
  async backToDashboard() {
    await this.backToDashboardButton.click();
    await this.page.waitForURL('/dashboard', { timeout: 10000 });
  }

  /**
   * Get patient name from the page
   */
  async getPatientName(): Promise<string> {
    const nameElement = this.page.locator('[data-testid="patient-name"]');
    return (await nameElement.textContent()) ?? '';
  }

  /**
   * Get test name from the page
   */
  async getTestName(): Promise<string> {
    const testElement = this.page.locator('[data-testid="test-name"]');
    return (await testElement.textContent()) ?? '';
  }

  /**
   * Handle edit result flow (when editing previously submitted result)
   */
  async editResult(editReason: string) {
    // This would be used when editing an existing result
    // The page would have pre-filled fields

    // Look for edit reason field
    const reasonField = this.page.locator('textarea[name="editReason"], input[name="editReason"]');
    if (await reasonField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await reasonField.fill(editReason);
    }

    await this.submit();
  }
}
