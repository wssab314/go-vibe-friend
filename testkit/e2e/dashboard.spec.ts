import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page before each test
    await page.goto('/'); // BaseURL is 'http://localhost:5173'

    // Fill in the credentials from the seed data
    await page.locator('input[name="email"]').fill('admin@demo.dev');
    await page.locator('input[name="password"]').fill('Pa$$');

    // Click the submit button to log in
    await page.locator('button:has-text("Sign In")').click();

    // Wait for navigation to the dashboard page and for a key element to be visible
    await page.waitForURL('/dashboard');
    await expect(page.locator('h2:has-text("Dashboard")')).toBeVisible();
  });

  test('should display system health metrics', async ({ page }) => {
    // Check if the "System Health" card or a similar element is present
    const systemHealthCard = page.locator('h3:has-text("System Health")'); // Assuming h3 for card titles
    await expect(systemHealthCard).toBeVisible();

    // Example: Check for a specific metric. Let's assume it's in a card.
    // This selector is a guess and likely needs to be updated with a data-test-id.
    const cpuMetric = page.locator('div:near(:text("System Health")) >> text=/CPU/i');
    await expect(cpuMetric).toBeVisible();
    
    const cpuValueText = await cpuMetric.innerText();
    expect(cpuValueText).toContain('%'); // e.g., "CPU Usage: 15%"
  });

  test('should allow navigation to the profile page', async ({ page }) => {
    // Click on a user menu or profile link. This is a guess.
    await page.locator('button:has-text("Admin")').click(); // Assuming a dropdown button with "Admin"
    await page.locator('a:has-text("Profile")').click();

    // Verify that the page navigated to the profile section
    await page.waitForURL('/profile');
    await expect(page.locator('h2:has-text("Profile")')).toBeVisible();
  });
});