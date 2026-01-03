import { test, expect } from '@playwright/test';

test.setTimeout(180000);

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
  const messageSelector = 'div[class*="max-w-"]';
  const prevCount = await page.locator(messageSelector).count();

  // Send a test message
  await page.fill('input[placeholder="Write a message..."]', 'Playwright E2E test message');
  await page.click('button:has-text("Send")');

  // Wait for the trpc sendMessage network call to complete (ensure backend got it)
  const trpcResp = await page.waitForResponse((res) => res.url().includes('/trpc') && res.request().method() === 'POST', { timeout: 120_000 });
  console.log('trpc response status', trpcResp.status(), 'url', trpcResp.url());
  const respBody = await trpcResp.json();
  console.log('trpc response body (truncated):', JSON.stringify(respBody).slice(0, 200));
  expect(trpcResp.ok()).toBeTruthy();

  // Ensure the AI text from the backend appears in the UI (use a snippet to avoid escaping issues)
  const aiText = (respBody?.[0]?.result?.data?.text as string) || '';
  const snippet = aiText.slice(0, 60).trim();
  await page.waitForSelector(`text=${snippet}`, { timeout: 120_000 });



  const newCount = await page.locator(messageSelector).count();
  expect(newCount).toBeGreaterThan(prevCount);
});
