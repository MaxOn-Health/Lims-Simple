import { Page, Locator } from '@playwright/test';

/**
 * Base page class with common utilities
 */
export class BasePage {
  readonly page: Page;

  // Common locators
  readonly toast: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Toast notifications (using Radix UI alert role)
    this.toast = page.getByRole('alert');

    // User menu (will need to be clicked to see logout)
    this.userMenu = page.locator('[data-testid="user-menu"], button:has-text("admin")').first();
    this.logoutButton = page.getByRole('menuitem', { name: /logout|sign out/i });
  }

  /**
   * Navigate to a URL path
   */
  async goto(path: string) {
    await this.page.goto(path);
  }

  /**
   * Wait for page to be loaded
   */
  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Reload the page
   */
  async reload() {
    await this.page.reload();
    await this.waitForLoad();
  }

  /**
   * Logout from the application
   */
  async logout() {
    // Try multiple possible logout selectors
    const logoutSelectors = [
      'button:has-text("Logout")',
      'button:has-text("Sign Out")',
      '[data-testid="logout-button"]',
    ];

    for (const selector of logoutSelectors) {
      const element = this.page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
        await element.click();
        await this.waitForLoad();
        return;
      }
    }

    // Fallback: clear cookies
    await this.page.context().clearCookies();
    await this.page.goto('/login');
  }

  /**
   * Get visible toast message
   */
  async getToastMessage(): Promise<string | null> {
    try {
      return await this.toast.textContent({ timeout: 5000 });
    } catch {
      return null;
    }
  }

  /**
   * Wait for toast to appear and return its message
   */
  async waitForToast(expectedMessage?: string): Promise<string> {
    await this.toast.waitFor({ state: 'visible', timeout: 10000 });
    const message = (await this.toast.textContent()) ?? '';
    if (expectedMessage) {
      if (!message.includes(expectedMessage)) {
        throw new Error(`Expected toast to contain "${expectedMessage}", but got "${message}"`);
      }
    }
    return message;
  }

  /**
   * Wait for modal to be visible
   */
  async waitForModal(title?: string) {
    const modal = this.page.locator('div[role="dialog"]');
    await modal.waitFor({ state: 'visible', timeout: 10000 });

    if (title) {
      await expect(modal).toContainText(title);
    }

    return modal;
  }

  /**
   * Close modal (if visible)
   */
  async closeModal() {
    const modal = this.page.locator('div[role="dialog"]');
    if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
      const closeButton = modal.getByLabel('Close').or(modal.locator('button:has-text("Cancel")')).first();
      await closeButton.click();
    }
  }

  /**
   * Fill a select dropdown (Shadcn Select)
   */
  async selectOption(selector: string, optionText: string) {
    const trigger = this.page.locator(selector);
    await trigger.click();

    // Wait for listbox to appear
    const listbox = this.page.getByRole('listbox');
    await listbox.waitFor({ state: 'visible', timeout: 5000 });

    // Type and select
    await this.page.keyboard.type(optionText);
    await this.page.keyboard.press('Enter');

    // Verify selection
    await expect(trigger).toContainText(optionText, { timeout: 5000 });
  }

  /**
   * Check a checkbox by label (Shadcn Checkbox)
   */
  async checkCheckbox(label: string) {
    const checkbox = this.page.getByLabel(label);
    await checkbox.click();

    // Verify checked state
    await expect(checkbox).toHaveAttribute('aria-checked', 'true', { timeout: 5000 });
  }

  /**
   * Uncheck a checkbox by label
   */
  async uncheckCheckbox(label: string) {
    const checkbox = this.page.getByLabel(label);
    await checkbox.click();

    // Verify unchecked state
    await expect(checkbox).toHaveAttribute('aria-checked', 'false', { timeout: 5000 });
  }

  /**
   * Wait for loading state to finish
   */
  async waitForLoadingToFinish() {
    // Wait for common loading indicators
    const loadingSelectors = [
      'text=Loading...',
      '[data-testid="loading"]',
      '.animate-spin',
    ];

    for (const selector of loadingSelectors) {
      try {
        await this.page.waitForSelector(selector, { state: 'detached', timeout: 30000 });
      } catch {
        // Continue if selector not found
      }
    }
  }
}

/**
 * Helper for expect statements in page objects
 */
async function expect(locator: Locator) {
  const { expect } = await import('@playwright/test');
  return expect(locator);
}
