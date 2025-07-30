import { test, expect } from '@playwright/test';
import path from 'path';

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

test('has file upload area with drag and drop support', async ({ page }) => {
  await page.goto('/create-color-scheme');

  // Check that the file upload area exists
  const uploadArea = page.getByTestId('file-upload-area');
  await expect(uploadArea).toBeVisible();

  // Check that it has the expected text
  await expect(uploadArea).toContainText('Drop an image here or click to browse');
  await expect(uploadArea).toContainText('Supports PNG, JPG, and other image formats');

  // Check that the hidden file input exists
  const fileInput = page.getByTestId('file-input');
  await expect(fileInput).toBeAttached();
  await expect(fileInput).toHaveAttribute('type', 'file');
  await expect(fileInput).toHaveAttribute('accept', 'image/*');
});

test('shows success message when file is uploaded', async ({ page }) => {
  await page.goto('/create-color-scheme');

  // Create a simple test image file (1x1 pixel PNG)
  const testImagePath = path.join(__dirname, '..', 'test-files', 'test-image.png');
  
  // Upload the file by clicking and using the file picker
  const fileInput = page.getByTestId('file-input');
  await fileInput.setInputFiles(testImagePath);

  // Wait for the success message to appear
  await expect(page.locator('text=Colorscheme generated')).toBeVisible({ timeout: 10000 });
  
  // Verify the upload another button is present
  await expect(page.locator('button:has-text("Upload Another Image")')).toBeVisible();
}); 