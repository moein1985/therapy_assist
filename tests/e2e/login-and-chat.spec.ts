import { test, expect } from '@playwright/test';

test('login demo and chat flow', async ({ page }) => {
  await page.goto('/login');

  // Click demo sign-in
  await page.click('button[aria-label="demo-signin"]');

  // Wait for dashboard navigation
  await page.waitForURL('/dashboard', { timeout: 15000 });
  await expect(page.locator('h1')).toHaveText(/سوابق حال روحی/);

  // Navigate to chat
  await page.goto('/chat');

  // Get current message count
  const messageSelector = '.max-w-\[70%\]';
  const prevCount = await page.locator(messageSelector).count();

  // Send a test message
  await page.fill('input[placeholder="Write a message..."]', 'Playwright E2E test message');
  await page.click('button:has-text("Send")');

  // Wait for Typing indicator then for messages to increase by at least 2 (user + ai)
  await page.waitForSelector('text=Typing...', { timeout: 15000 });

  await page.waitForFunction((selector, prev) => {
    return document.querySelectorAll(selector).length >= prev + 2;
  }, messageSelector, prevCount, { timeout: 30000 });

  const newCount = await page.locator(messageSelector).count();
  expect(newCount).toBeGreaterThan(prevCount);
});
