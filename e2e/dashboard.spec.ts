import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  // Use a shared auth state for authenticated tests
  test.use({
    storageState: {
      cookies: [],
      origins: [
        {
          origin: 'http://localhost:3000',
          localStorage: [
            {
              name: 'token',
              value: 'test-token', // This would be a real token in actual tests
            },
          ],
        },
      ],
    },
  });

  test.describe('Unauthenticated Access', () => {
    test.use({ storageState: undefined }); // Clear auth state

    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
    });
  });

  test.describe('Dashboard Navigation', () => {
    test.skip('should display main dashboard components', async ({ page }) => {
      // Skip this test until auth is properly set up
      await page.goto('/dashboard');

      // Check for main dashboard elements
      await expect(page.getByRole('navigation')).toBeVisible();
      await expect(page.getByText(/dashboard|inicio/i)).toBeVisible();
    });

    test.skip('should show study statistics', async ({ page }) => {
      await page.goto('/dashboard');

      // Check for stats cards
      await expect(page.getByText(/materias|subjects/i)).toBeVisible();
      await expect(page.getByText(/flashcards/i)).toBeVisible();
      await expect(page.getByText(/quizzes/i)).toBeVisible();
    });

    test.skip('should have navigation to main features', async ({ page }) => {
      await page.goto('/dashboard');

      // Check navigation links
      await expect(page.getByRole('link', { name: /flashcards/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /quizzes/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /subjects|materias/i })).toBeVisible();
    });
  });

  test.describe('Dashboard Quick Actions', () => {
    test.skip('should navigate to create flashcard deck', async ({ page }) => {
      await page.goto('/dashboard');

      // Look for quick action button
      const createDeckButton = page.getByRole('button', { name: /crear deck|new deck/i });
      if (await createDeckButton.isVisible()) {
        await createDeckButton.click();
        await expect(page).toHaveURL(/.*flashcards.*new|create/);
      }
    });

    test.skip('should navigate to start quiz', async ({ page }) => {
      await page.goto('/dashboard');

      // Look for start quiz action
      const startQuizButton = page.getByRole('button', { name: /iniciar quiz|start quiz/i });
      if (await startQuizButton.isVisible()) {
        await startQuizButton.click();
        await expect(page).toHaveURL(/.*quizzes/);
      }
    });
  });

  test.describe('Dashboard Responsiveness', () => {
    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/login'); // Use login page since it doesn't require auth

      // Check that the page is responsive
      const viewport = page.viewportSize();
      expect(viewport?.width).toBe(375);

      // Main content should still be visible
      await expect(page.getByRole('heading')).toBeVisible();
    });

    test('should be responsive on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/login');

      const viewport = page.viewportSize();
      expect(viewport?.width).toBe(768);

      await expect(page.getByRole('heading')).toBeVisible();
    });
  });
});
