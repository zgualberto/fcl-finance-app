import { test, expect } from '@playwright/test';

/**
 * Smoke tests: verify the app boots in a desktop browser (web SPA mode
 * with jeep-sqlite) and core navigation works. Each test gets a fresh
 * browser context, i.e. a fresh IndexedDB / SQLite store.
 *
 * Add more specs alongside this file as coverage grows.
 */
test.describe('smoke', () => {
  test('app boots, redirects to YTD collections, no page errors', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));

    await page.goto('/');

    // Root redirects to /ytd-collections (hash router mode)
    await expect(page).toHaveURL(/#\/ytd-collections/);

    // App header renders
    await expect(page.getByText('FCL Finance System')).toBeVisible();

    // Default page content renders (DB booted successfully)
    await expect(page.getByText('Annual Collections Dashboard')).toBeVisible({
      timeout: 30_000,
    });

    expect(errors).toEqual([]);
  });

  test('main navigation reaches key pages', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));

    await page.goto('/#/ytd-collections');
    await expect(page.getByText('Annual Collections Dashboard')).toBeVisible({
      timeout: 30_000,
    });

    await page.goto('/#/expenses');
    await expect(page).toHaveURL(/#\/expenses/);

    await page.goto('/#/members');
    await expect(page).toHaveURL(/#\/members/);

    expect(errors).toEqual([]);
  });
});
