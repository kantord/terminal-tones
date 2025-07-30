import { test, expect } from '@playwright/test';

test('create color scheme page has correct title', async ({ page }) => {
  await page.goto('/create-color-scheme');

  // Expect the page title to contain "Create Color Scheme"
  await expect(page).toHaveTitle(/Create Color Scheme - Terminal Tones/);
});

test('create color scheme page has correct heading', async ({ page }) => {
  await page.goto('/create-color-scheme');

  // Expect the main heading to be visible
  await expect(page.locator('h1')).toHaveText('Create Color Scheme');
}); 