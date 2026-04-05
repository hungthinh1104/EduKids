import { test, expect, Page } from '@playwright/test';

function mockAuthSuccess(page: Page) {
  return page.route('**/auth/login', async (route) => {
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
}

test('login critical flow: valid credentials navigate to parent dashboard', async ({ page }) => {
  await mockAuthSuccess(page);

  await page.goto('/login');

  await page.locator('input[type="email"]').fill('parent@example.com');
  await page.locator('input[type="password"]').fill('SecurePass123');
  await page.getByText(/Khởi hành ngay!/).click();

  await expect(page).toHaveURL(/\/dashboard/);
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
  await page.route('**/auth/forgot-password', async (route) => {
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
