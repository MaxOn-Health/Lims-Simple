import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Testing Configuration for LIMS
 *
 * Base URL: http://localhost:3001 (frontend dev server)
 * Backend API: http://localhost:3000
 */
export default defineConfig({
  // Test directory
  testDir: './e2e',

  // Timeout settings
  timeout: 120 * 1000, // 2 minutes (slow backend)
  expect: {
    timeout: 10 * 1000, // 10 seconds for assertions
  },

  // Fully parallel test execution
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Limit workers on CI for stability
  workers: process.env.CI ? 2 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],

  // Shared settings for all tests
  use: {
    // Base URL for tests
    baseURL: 'http://localhost:3001',

    // Collect trace when retrying
    trace: 'on-first-retry',

    // Screenshot settings
    screenshot: 'only-on-failure',

    // Video recording
    video: 'retain-on-failure',

    // Action navigation timeout
    actionTimeout: 15 * 1000,

    // Navigation timeout
    navigationTimeout: 30 * 1000,
  },

  // Configure projects for different browsers and devices
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
