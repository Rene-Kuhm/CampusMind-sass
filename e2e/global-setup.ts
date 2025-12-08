import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright E2E tests
 * This runs once before all tests
 */
async function globalSetup(config: FullConfig) {
  console.log('Running global setup for E2E tests...');

  // Optional: Create authenticated state for tests
  // This is useful for tests that require login
  if (process.env.TEST_USER_EMAIL && process.env.TEST_USER_PASSWORD) {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Navigate to login page
      const baseUrl = config.projects[0].use.baseURL || 'http://localhost:3000';
      await page.goto(`${baseUrl}/login`);

      // Fill login form
      await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL);
      await page.getByLabel(/contraseña|password/i).fill(process.env.TEST_USER_PASSWORD);
      await page.getByRole('button', { name: /iniciar sesión|login/i }).click();

      // Wait for redirect to dashboard
      await page.waitForURL(/.*dashboard/, { timeout: 10000 });

      // Save authenticated state
      await context.storageState({ path: './e2e/.auth/user.json' });
      console.log('Authenticated state saved successfully');
    } catch (error) {
      console.warn('Could not create authenticated state:', error);
      // Continue without authenticated state
    } finally {
      await browser.close();
    }
  }

  // Optional: Seed test data
  // await seedTestData();

  console.log('Global setup completed');
}

export default globalSetup;
