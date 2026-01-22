import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Login Page Object Model
 */
export class LoginPage extends BasePage {
  // Form locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly forgotPasswordLink: Locator;

  // Page elements
  readonly heading: Locator;
  readonly loginForm: Locator;

  constructor(page: Page) {
    super(page);

    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.getByRole('button', { name: 'Sign In' });
    this.forgotPasswordLink = page.getByRole('link', { name: /forgot password/i });

    // The main heading is "Laboratory Information Management System"
    this.heading = page.getByRole('heading', { name: 'Laboratory Information Management System' });
    this.loginForm = page.locator('form');
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await this.page.goto('/login');
    await this.heading.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();

    // Wait for navigation to complete - don't assert specific URL since it depends on role
    // Just wait for the URL to change from /login
    await this.page.waitForURL(/^(?!.*\/login).*$/, {
      timeout: 15000,
    });
  }

  /**
   * Login and wait for specific URL
   */
  async loginAndWaitFor(email: string, password: string, expectedPath: RegExp) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();

    await this.page.waitForURL(expectedPath, { timeout: 15000 });
  }

  /**
   * Get error message (if login fails)
   */
  async getErrorMessage(): Promise<string | null> {
    const errorLocator = this.page.locator('.text-destructive, [role="alert"], .error-message');
    try {
      return await errorLocator.first().textContent({ timeout: 5000 });
    } catch {
      return null;
    }
  }

  /**
   * Verify we are on the login page
   */
  async isOnPage(): Promise<boolean> {
    return await this.heading.isVisible({ timeout: 5000 });
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }
}
