import { test, expect, type Page } from '@playwright/test';

// Advanced track happy path across both Phase-1 archetypes.
// Combo ("The returning client"): two cards from two families together (episodic memory + doc
// reader). Chain ("The order invoice"): three links in order across three families (episodic
// memory + calculator + critic). Each placement uses the click-from-inventory flow.

async function useEnglish(page: Page): Promise<void> {
  const toggle = page.locator('.locale-toggle');
  await expect(toggle).toBeVisible();
  const lang = await page.locator('html').getAttribute('lang');
  if (lang !== 'en') await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
}

async function place(page: Page, cardName: string, slotName: string): Promise<void> {
  // Card buttons carry a cost aria-label too, so match the label as a substring; slot names are
  // exact so "Memory" doesn't also match the "Memory of past chats" chip.
  await page.getByRole('button', { name: cardName }).click();
  await page.getByRole('button', { name: slotName, exact: true }).click();
}

async function expectThreeStars(page: Page): Promise<void> {
  const result = page.locator('.result.pass');
  await expect(result).toBeVisible();
  await expect(result.locator('.star-list .star')).toHaveCount(3);
  const stars = await result.locator('.star-list .star').allInnerTexts();
  expect(stars.every((g) => g.trim() === '⭐')).toBe(true);
}

test('advanced combo then chain both score three stars', async ({ page }) => {
  await page.goto('/');
  await useEnglish(page);

  await page.getByRole('link', { name: /Advanced game/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: /Advanced game/i })).toBeVisible();

  // Combo: episodic memory + document reader.
  await page.getByRole('link', { name: /The returning client/i }).click();
  await expect(page.getByRole('heading', { level: 1, name: /Build your assistant/i })).toBeVisible();
  await place(page, 'Memory of past chats', 'Memory');
  await place(page, 'Document reading', 'Skills');
  await page.getByRole('button', { name: /Run/ }).click();
  await expectThreeStars(page);

  // "Next" advances to the chain level (combo is no longer the last level).
  await page.locator('.result.pass').getByRole('button', { name: /Next/ }).click();
  await expect(page).toHaveURL(/\/advanced\/adv-chain-invoice/);

  // Chain: recall (memory) → total (calculator) → review (critic), three families in three slots.
  await place(page, 'Memory of past chats', 'Memory');
  await place(page, 'Calculator', 'Skills');
  await place(page, 'Review the result', 'Review');
  await page.getByRole('button', { name: /Run/ }).click();
  await expectThreeStars(page);

  // "Next" advances to the trade-off levels that follow the chain.
  await page.locator('.result.pass').getByRole('button', { name: /Next/ }).click();
  await expect(page).toHaveURL(/\/advanced\/adv-tradeoff-mailout/);
});
