import { test, expect, type Page } from '@playwright/test';

// Advanced track happy path: home -> Advanced game -> "The returning client" (Combo archetype).
// This level needs TWO cards from two different families together: episodic memory + the document
// reader. Placing both and running should pass all three stars; the single combo level is the last
// in the track, so "Next" returns to the advanced list.

async function useEnglish(page: Page): Promise<void> {
  const toggle = page.locator('.locale-toggle');
  await expect(toggle).toBeVisible();
  const lang = await page.locator('html').getAttribute('lang');
  if (lang !== 'en') await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
}

test('advanced combo level needs two cards across families and scores three stars', async ({
  page
}) => {
  await page.goto('/');
  await useEnglish(page);

  await page.getByRole('link', { name: /Advanced game/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: /Advanced game/i })).toBeVisible();

  await page.getByRole('link', { name: /The returning client/i }).click();
  await expect(page.getByRole('heading', { level: 1, name: /Build your assistant/i })).toBeVisible();

  // Place episodic memory into the Memory slot.
  await page.getByRole('button', { name: 'Memory of past chats' }).click();
  await page.getByRole('button', { name: 'Memory', exact: true }).click();

  // Place the document reader into the Skills slot.
  await page.getByRole('button', { name: 'Document reading' }).click();
  await page.getByRole('button', { name: 'Skills', exact: true }).click();

  await page.getByRole('button', { name: /Run/ }).click();

  const result = page.locator('.result.pass');
  await expect(result).toBeVisible();
  await expect(result.locator('.star-list .star')).toHaveCount(3);
  const stars = await result.locator('.star-list .star').allInnerTexts();
  expect(stars.every((g) => g.trim() === '⭐')).toBe(true);

  // Last level in the track → "Next" returns to the advanced list.
  await result.getByRole('button', { name: /Next/ }).click();
  await expect(page).toHaveURL(/\/advanced$/);
});
