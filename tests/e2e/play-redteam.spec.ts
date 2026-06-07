import { test, expect, type Page } from '@playwright/test';

// Red-team finale: an email tries to trigger an irreversible money transfer with a hidden command.
// The winning build needs BOTH safety cards across two families — a guardrail to spot the trick and
// human approval before the transfer. Missing the human sign-off fails even when the trick is caught.

async function useEnglish(page: Page): Promise<void> {
  const toggle = page.locator('.locale-toggle');
  await expect(toggle).toBeVisible();
  const lang = await page.locator('html').getAttribute('lang');
  if (lang !== 'en') await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
}

async function place(page: Page, cardName: string, slotName: string): Promise<void> {
  await page.getByRole('button', { name: cardName }).click();
  await page.getByRole('button', { name: slotName, exact: true }).click();
}

test('finale: guardrail + human approval defeats the booby-trapped transfer', async ({ page }) => {
  await page.goto('/advanced/adv-redteam-transfer');
  await useEnglish(page);

  await place(page, 'Safety check', 'Safety');
  await place(page, 'Human approval', 'Approval');
  await page.getByRole('button', { name: /Run/ }).click();

  const result = page.locator('.result.pass');
  await expect(result).toBeVisible();
  const stars = await result.locator('.star-list .star').allInnerTexts();
  expect(stars.every((g) => g.trim() === '⭐')).toBe(true);
});

test('finale: catching the trick but skipping human approval still fails', async ({ page }) => {
  await page.goto('/advanced/adv-redteam-transfer');
  await useEnglish(page);

  await place(page, 'Safety check', 'Safety');
  await page.getByRole('button', { name: /Run/ }).click();

  await expect(page.locator('.result.fail')).toBeVisible();
  await expect(page.locator('.diagnosis')).toContainText(/human approval/i);
});
