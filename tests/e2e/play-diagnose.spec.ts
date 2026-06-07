import { test, expect, type Page } from '@playwright/test';

// Diagnose archetype: the level loads with a BROKEN preset already on the board and its failed run
// shown. The player reads the trace, swaps the wrong cards (remove the wrong one, pick the right one
// from the slot's "+" dropdown), and re-runs to a pass.

async function useEnglish(page: Page): Promise<void> {
  const toggle = page.locator('.locale-toggle');
  await expect(toggle).toBeVisible();
  const lang = await page.locator('html').getAttribute('lang');
  if (lang !== 'en') await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
}

async function swap(page: Page, filledName: RegExp, slotName: string, rightCard: string): Promise<void> {
  // Remove the wrong card, then choose the right one from the now-empty slot's picker.
  await page.getByRole('button', { name: filledName }).click();
  await page.getByRole('button', { name: slotName, exact: true }).click();
  await page.locator('.slot-menu').getByRole('button', { name: rightCard }).click();
}

test('diagnose level loads broken, and swapping the wrong cards repairs it', async ({ page }) => {
  await page.goto('/advanced/adv-diagnose-support');
  await useEnglish(page);

  // It starts already failing (the broken preset auto-ran).
  await expect(page.locator('.result.fail')).toBeVisible();

  // Fix the memory, then the tool.
  await swap(page, /Memory: In-conversation memory/, 'Memory', 'Memory of past chats');
  await swap(page, /Skills: Web search/, 'Skills', 'Document reading');

  await page.getByRole('button', { name: /Run/ }).click();

  const result = page.locator('.result.pass');
  await expect(result).toBeVisible();
  const stars = await result.locator('.star-list .star').allInnerTexts();
  expect(stars.every((g) => g.trim() === '⭐')).toBe(true);
});
