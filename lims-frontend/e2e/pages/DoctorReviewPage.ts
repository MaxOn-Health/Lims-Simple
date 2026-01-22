import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Doctor Review Page Object Model
 * Handles doctor review workflow and report signing
 */
export class DoctorReviewPage extends BasePage {
  // Page elements
  readonly heading: Locator;
  readonly patientsList: Locator;

  // Review form
  readonly clinicalRemarksInput: Locator;
  readonly saveReviewButton: Locator;
  readonly signReportButton: Locator;
  readonly setupPasskeyButton: Locator;

  // Passkey modal
  readonly passkeyModal: Locator;
  readonly passkeyInput: Locator;
  readonly confirmPasskeyButton: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.getByRole('heading', { name: /patients for review|doctor review/i });
    this.patientsList = page.locator('[data-testid="patient-review-card"], .border-border\\/50');

    this.clinicalRemarksInput = page.locator('textarea[name="clinicalRemarks"], #clinicalRemarks');
    this.saveReviewButton = page.getByRole('button', { name: 'Save Review' });
    this.signReportButton = page.getByRole('button', { name: 'Sign Report' });
    this.setupPasskeyButton = page.getByRole('button', { name: 'Setup Passkey' });

    this.passkeyModal = page.locator('div[role="dialog"]').filter({ hasText: /passkey|pin/i });
    this.passkeyInput = this.passkeyModal.locator('input[type="password"]');
    this.confirmPasskeyButton = this.passkeyModal.getByRole('button', { name: 'Confirm' });
  }

  /**
   * Navigate to doctor review page
   */
  async goto() {
    await this.page.goto('/doctor/patients');
    await this.heading.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Navigate to doctor dashboard
   */
  async gotoDashboard() {
    await this.page.goto('/doctor/dashboard');
    await this.page.getByRole('heading', { name: /dashboard/i }).waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Get all patients ready for review
   */
  async getPatientsForReview() {
    await this.patientsList.first().waitFor({ state: 'visible', timeout: 10000 });
    return this.patientsList.all();
  }

  /**
   * Find patient card by patient name
   */
  async findPatient(patientName: string): Promise<Locator | null> {
    const cards = this.patientsList.filter({ hasText: patientName });
    const count = await cards.count();

    if (count === 0) {
      return null;
    }

    return cards.first();
  }

  /**
   * Click on a patient to review their results
   */
  async reviewPatient(patientName: string) {
    const card = await this.findPatient(patientName);
    if (!card) {
      throw new Error(`Patient "${patientName}" not found in review list`);
    }

    // Click on the card or "Review" button
    const reviewButton = card.getByRole('button', { name: /review|view/i });
    if (await reviewButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await reviewButton.click();
    } else {
      await card.click();
    }

    // Wait for navigation to patient detail/review page
    await this.page.waitForURL(/\/doctor\/patient\/.+|\/patients\/.+/i, { timeout: 10000 });
  }

  /**
   * Add clinical remarks
   */
  async addClinicalRemarks(remarks: string) {
    await this.clinicalRemarksInput.fill(remarks);
  }

  /**
   * Save the review
   */
  async saveReview() {
    await this.saveReviewButton.click();

    // Wait for success toast
    await this.waitForToast('saved|updated|success');
  }

  /**
   * Sign report with passkey
   */
  async signWithPasskey(passkey: string) {
    await this.signReportButton.click();

    // Handle passkey modal
    await this.passkeyModal.waitFor({ state: 'visible', timeout: 5000 });
    await this.passkeyInput.fill(passkey);
    await this.confirmPasskeyButton.click();

    // Wait for success
    await this.waitForToast('signed|success');
  }

  /**
   * Setup passkey (for first-time doctor users)
   */
  async setupPasskey(newPasskey: string) {
    await this.setupPasskeyButton.click();

    // Handle setup modal
    const setupModal = this.page.locator('div[role="dialog"]').filter({ hasText: /setup passkey/i });
    await setupModal.waitFor({ state: 'visible', timeout: 5000 });

    // Fill new passkey
    const passkeyInput = setupModal.locator('input[name="passkey"], input[type="password"]');
    await passkeyInput.fill(newPasskey);

    // Confirm passkey
    const confirmInput = setupModal.locator('input[name="confirmPasskey"], input[name="confirm"]');
    await confirmInput.fill(newPasskey);

    // Submit
    await setupModal.getByRole('button', { name: 'Setup' }).click();

    // Wait for success
    await this.waitForToast('setup|success|created');
  }

  /**
   * Navigate to signed reports page
   */
  async gotoSignedReports() {
    await this.page.goto('/doctor/signed-reports');
    await this.page.getByRole('heading', { name: /signed reports/i }).waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Check if report is signed
   */
  async isReportSigned(patientName: string): Promise<boolean> {
    const card = await this.findPatient(patientName);
    if (!card) {
      return false;
    }

    const signedBadge = card.getByText(/signed/i);
    return await signedBadge.isVisible({ timeout: 2000 }).catch(() => false);
  }
}
