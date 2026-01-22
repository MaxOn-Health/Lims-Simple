import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Assignments Page Object Model
 */
export class AssignmentsPage extends BasePage {
  // Page headings
  readonly heading: Locator;

  // Assignment cards
  readonly assignmentCards: Locator;
  readonly filterButtons: Locator;

  // Assignment actions
  readonly startButton: Locator;
  readonly enterResultsButton: Locator;
  readonly viewDetailsButton: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.getByRole('heading', { name: /assignments|my tasks/i });
    this.assignmentCards = page.locator('.border-border\\/50, [data-testid="assignment-card"]');
    this.filterButtons = page.locator('[data-testid="filter-button"]');

    // Action buttons within cards
    this.startButton = page.getByRole('button', { name: 'Start' });
    this.enterResultsButton = page.getByRole('button', { name: 'Enter Results' });
    this.viewDetailsButton = page.getByRole('button', { name: /view|details/i });
  }

  /**
   * Navigate to assignments page
   */
  async goto() {
    await this.page.goto('/assignments');
    await this.heading.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Navigate to "My Assignments" page
   */
  async gotoMyAssignments() {
    await this.page.goto('/assignments/my-assignments');
    await this.page.getByRole('heading', { name: 'My Tasks' }).waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Get all assignment cards
   */
  async getAssignments() {
    await this.assignmentCards.first().waitFor({ state: 'visible', timeout: 10000 });
    return this.assignmentCards.all();
  }

  /**
   * Find assignment card by patient name
   */
  async findAssignmentByPatient(patientName: string): Promise<Locator | null> {
    const cards = this.assignmentCards.filter({ hasText: patientName });
    const count = await cards.count();

    if (count === 0) {
      return null;
    }

    return cards.first();
  }

  /**
   * Get assignment card text content
   */
  async getAssignmentText(patientName: string): Promise<string> {
    const card = await this.findAssignmentByPatient(patientName);
    if (!card) {
      throw new Error(`Assignment for patient "${patientName}" not found`);
    }
    return await card.innerText();
  }

  /**
   * Get assignment status
   */
  async getAssignmentStatus(patientName: string): Promise<string | null> {
    const card = await this.findAssignmentByPatient(patientName);
    if (!card) {
      return null;
    }

    // Look for status badge (common patterns: "Assigned", "In Progress", "Completed")
    const statusBadge = card.locator('text=/^(Assigned|In Progress|Completed|Pending)$/i');
    try {
      return await statusBadge.first().textContent({ timeout: 2000 });
    } catch {
      return null;
    }
  }

  /**
   * Start an assignment (change status from ASSIGNED to IN_PROGRESS)
   */
  async startAssignment(patientName: string) {
    const card = await this.findAssignmentByPatient(patientName);
    if (!card) {
      throw new Error(`Assignment for patient "${patientName}" not found`);
    }

    await card.getByRole('button', { name: 'Start' }).click();

    // Handle status update modal
    await this.handleStatusUpdateModal('In Progress');
  }

  /**
   * Enter results for an assignment
   */
  async enterResults(patientName: string) {
    const card = await this.findAssignmentByPatient(patientName);
    if (!card) {
      throw new Error(`Assignment for patient "${patientName}" not found`);
    }

    await card.getByRole('button', { name: 'Enter Results' }).click();

    // Wait for navigation to result entry page
    await this.page.waitForURL(/\/results\/entry\/.+/, { timeout: 10000 });
  }

  /**
   * Handle the status update modal
   */
  async handleStatusUpdateModal(status: string) {
    const modal = this.page.locator('div[role="dialog"]');
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    // Select status if needed (often pre-selected)
    const statusOption = modal.getByRole('option', { name: status });
    if (await statusOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await statusOption.click();
    }

    // Click update button
    await modal.getByRole('button', { name: 'Update Status' }).click();

    // Wait for modal to close
    await modal.waitFor({ state: 'detached', timeout: 5000 });
  }

  /**
   * Wait for assignment to appear
   */
  async waitForAssignment(patientName: string, timeout = 30000) {
    const card = await this.findAssignmentByPatient(patientName);
    if (!card) {
      throw new Error(`Assignment for patient "${patientName}" not found after timeout`);
    }
    await card.waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait for assignment to be removed (e.g., after completion)
   */
  async waitForAssignmentRemoval(patientName: string, timeout = 30000) {
    const card = await this.findAssignmentByPatient(patientName);
    if (card) {
      await card.waitFor({ state: 'detached', timeout });
    }
  }

  /**
   * Filter assignments by status
   */
  async filterByStatus(status: 'all' | 'assigned' | 'in-progress' | 'completed') {
    // This depends on your UI implementation
    const filterButton = this.page.locator(`[data-testid="filter-${status}"]`);
    await filterButton.click();
    await this.page.waitForTimeout(500); // Wait for filter to apply
  }
}
