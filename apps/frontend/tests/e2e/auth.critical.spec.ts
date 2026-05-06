import { test, expect, Page } from '@playwright/test';

// In dev/test, the browser calls the backend directly at NEXT_PUBLIC_API_URL
// (see api.client.ts: localhost → bypass Next.js proxy).
// Playwright intercepts at the browser level, so we match the backend URL.
const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ?? 'http://localhost:3001/api';

async function mockAuthSuccess(page: Page) {
  await page.route(/\/api\/auth\/login/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          role: 'PARENT',
          user: {
            id: 1,
            email: 'parent@example.com',
            firstName: 'Parent',
            lastName: 'User',
            isActive: true,
            isEmailVerified: true,
            createdAt: new Date().toISOString(),
            role: 'PARENT',
          },
        },
      }),
    });
  });

  // Mock child profiles endpoint so dashboard doesn't trigger 401→logout loop
  await page.route(/\/api\/profiles/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

  // Mock token refresh so mock tokens don't cause auto-logout
  await page.route(/\/api\/auth\/refresh/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' } }),
    });
  });
}

test('login critical flow: valid credentials navigate to parent dashboard', async ({ page }) => {
  await mockAuthSuccess(page);

  await page.goto('/login');

  await page.locator('input[type="email"]').fill('parent@example.com');
  await page.locator('input[type="password"]').fill('SecurePass123');
  await page.getByText(/Khởi hành ngay!/).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
});

test('register critical validation: mismatched confirm password shows error', async ({ page }) => {
  await page.goto('/register');

  await page.getByPlaceholder('Nguyễn').fill('Nguyen');
  await page.getByPlaceholder('Văn A').fill('An');
  await page.locator('input[type="email"]').fill('new-parent@example.com');

  const passwordInputs = page.locator('input[type="password"]');
  await passwordInputs.nth(0).fill('StrongPass123');
  await passwordInputs.nth(1).fill('StrongPass999');

  await page.getByRole('button', { name: /Tạo tài khoản/i }).click();

  await expect(page.getByText('Mật khẩu không khớp')).toBeVisible();
});

test('forgot-password critical flow: success state is shown after submit', async ({ page }) => {
  await page.route(/\/api\/auth\/forgot-password/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          message: 'If this email is registered, a reset link has been sent.',
          resetToken: 'mock-reset-token',
        },
      }),
    });
  });

  await page.goto('/forgot-password');
  await page.locator('input[type="email"]').fill('parent@example.com');
  await page.getByRole('button', { name: /Gửi link đặt lại/i }).click();

  await expect(page.getByText('Yêu cầu đã được gửi!')).toBeVisible();
  await expect(page.getByText(/mock-reset-token/)).toBeVisible();
});
