import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
  });

  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login');

      await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/contraseña/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible();
    });

    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/login');

      await page.getByRole('button', { name: /iniciar sesión/i }).click();

      // HTML5 validation should prevent submission
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toHaveAttribute('required', '');
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel(/email/i).fill('invalid@example.com');
      await page.getByLabel(/contraseña/i).fill('wrongpassword');
      await page.getByRole('button', { name: /iniciar sesión/i }).click();

      // Wait for error message
      await expect(page.getByText(/credenciales inválidas|invalid credentials/i)).toBeVisible({ timeout: 10000 });
    });

    test('should have link to forgot password', async ({ page }) => {
      await page.goto('/login');

      const forgotLink = page.getByRole('link', { name: /olvidé mi contraseña|forgot password/i });
      await expect(forgotLink).toBeVisible();
      await expect(forgotLink).toHaveAttribute('href', '/forgot-password');
    });

    test('should have link to register', async ({ page }) => {
      await page.goto('/login');

      const registerLink = page.getByRole('link', { name: /crear cuenta|registrarse|sign up/i });
      await expect(registerLink).toBeVisible();
    });

    test('should redirect to dashboard after successful login', async ({ page }) => {
      // This test requires a test user to be set up
      await page.goto('/login');

      await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL || 'test@campusmind.com');
      await page.getByLabel(/contraseña/i).fill(process.env.TEST_USER_PASSWORD || 'testpassword123');
      await page.getByRole('button', { name: /iniciar sesión/i }).click();

      // Should redirect to dashboard on success
      await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
    });
  });

  test.describe('Registration Page', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto('/register');

      await expect(page.getByRole('heading', { name: /crear cuenta|registrarse|sign up/i })).toBeVisible();
      await expect(page.getByLabel(/nombre/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
    });

    test('should validate password requirements', async ({ page }) => {
      await page.goto('/register');

      await page.getByLabel(/nombre/i).fill('Test User');
      await page.getByLabel(/email/i).fill('newuser@example.com');

      // Try with a short password
      const passwordInputs = page.locator('input[type="password"]');
      await passwordInputs.first().fill('short');

      await page.getByRole('button', { name: /crear cuenta|registrarse|sign up/i }).click();

      // Should show password validation error
      await expect(page.getByText(/8 caracteres|8 characters/i)).toBeVisible({ timeout: 5000 });
    });

    test('should have link to login', async ({ page }) => {
      await page.goto('/register');

      const loginLink = page.getByRole('link', { name: /iniciar sesión|login|ya tengo cuenta/i });
      await expect(loginLink).toBeVisible();
    });
  });

  test.describe('Forgot Password Page', () => {
    test('should display forgot password form', async ({ page }) => {
      await page.goto('/forgot-password');

      await expect(page.getByRole('heading', { name: /recuperar contraseña/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /enviar enlace/i })).toBeVisible();
    });

    test('should submit email for password reset', async ({ page }) => {
      await page.goto('/forgot-password');

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByRole('button', { name: /enviar enlace/i }).click();

      // Should show success message (regardless of whether email exists)
      await expect(page.getByText(/revisa tu email|check your email/i)).toBeVisible({ timeout: 10000 });
    });

    test('should have link back to login', async ({ page }) => {
      await page.goto('/forgot-password');

      const loginLink = page.getByRole('link', { name: /volver|inicio de sesión|login/i });
      await expect(loginLink).toBeVisible();
      await expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  test.describe('Reset Password Page', () => {
    test('should show invalid link without token', async ({ page }) => {
      await page.goto('/reset-password');

      await expect(page.getByText(/enlace inválido|invalid link/i)).toBeVisible({ timeout: 5000 });
    });

    test('should show invalid link with expired token', async ({ page }) => {
      await page.goto('/reset-password?token=expired-token&email=test@example.com');

      await expect(page.getByText(/enlace inválido|invalid link|expirado/i)).toBeVisible({ timeout: 10000 });
    });
  });
});
