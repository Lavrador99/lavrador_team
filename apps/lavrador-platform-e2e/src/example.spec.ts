import { test, expect } from '@playwright/test';

// These tests verify the flows fixed in the exercise-replacement bug fix branch.
// Run with: npx playwright test --config apps/lavrador-platform-e2e/playwright.config.ts
// Requires the app to be running at BASE_URL (default: http://localhost:4501)

test.describe('Public routes (no auth required)', () => {
  test('onboarding page loads without authentication', async ({ page }) => {
    // Middleware must allow /onboarding/* without redirecting to login (T5 fix)
    await page.goto('/onboarding/test-token-that-does-not-exist');
    expect(page.url()).not.toContain('/login');
  });

  test('login page is accessible', async ({ page }) => {
    const resp = await page.goto('/login');
    expect(resp?.status()).toBeLessThan(500);
    expect(page.url()).toContain('/login');
  });
});

test.describe('Auth redirect behaviour', () => {
  test('unauthenticated user on /client/stats is redirected to login', async ({ page }) => {
    await page.goto('/client/stats');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user on /client/my-plan is redirected to login', async ({ page }) => {
    await page.goto('/client/my-plan');
    await expect(page).toHaveURL(/\/login/);
  });
});
