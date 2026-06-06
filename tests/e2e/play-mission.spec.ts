import { test, expect, type Page } from '@playwright/test';

// Happy path: home -> Campaign -> first mission -> place the correct role card -> Run -> ⭐⭐⭐.
// Mission 1-1-greet needs exactly the "Friendly helper" role (role-greeter); placing it and running
// should pass all three stars (correct answer + minimal set + within budget).

// Force EN so the text-based selectors below are stable regardless of the browser's locale default.
// The single header toggle flips RU<->EN; click it only if we're not already in EN (the test runner's
// navigator may default to either locale). <html lang> mirrors the active locale (set in the layout).
async function useEnglish(page: Page): Promise<void> {
  const toggle = page.locator('.locale-toggle');
  await expect(toggle).toBeVisible();
  const lang = await page.locator('html').getAttribute('lang');
  if (lang !== 'en') {
    await toggle.click();
  }
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
}

test('campaign first mission scores three stars with the right card', async ({ page }) => {
  await page.goto('/');
  await useEnglish(page);

  // Home: pick Campaign.
  await page.getByRole('link', { name: /^Campaign/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: /Task map/i })).toBeVisible();

  // World map: open the first mission (1-1-greet). It's the first mission link on the page.
  await page.getByRole('link', { name: /greets them warmly/i }).click();
  await expect(page.getByRole('heading', { level: 1, name: /Build your assistant/i })).toBeVisible();

  // Place the correct role card: click the inventory chip, then the Role slot.
  await page.getByRole('button', { name: 'Friendly helper' }).click();
  // The Role slot's accessible name is just the slot label when empty.
  await page.getByRole('button', { name: 'Role', exact: true }).click();

  // Run.
  await page.getByRole('button', { name: /Run/ }).click();

  // Pass banner appears and all three stars are earned (⭐), none lost (☆).
  await expect(page.getByText(/Done! The assistant handled the task\./i)).toBeVisible();

  const result = page.locator('.result.pass');
  await expect(result).toBeVisible();
  // Three filled stars, zero hollow stars in the star breakdown.
  await expect(result.locator('.star-list .star')).toHaveCount(3);
  const starGlyphs = await result.locator('.star-list .star').allInnerTexts();
  expect(starGlyphs.every((g) => g.trim() === '⭐')).toBe(true);
});
