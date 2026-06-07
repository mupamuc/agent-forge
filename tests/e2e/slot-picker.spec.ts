import { test, expect, type Page } from '@playwright/test';

// The inline slot picker: clicking an empty slot's "+" (with no card pre-selected in the inventory)
// opens a dropdown of the cards that fit that slot; choosing one places it. This is the alternative
// to drag-and-drop / click-from-inventory.

async function useEnglish(page: Page): Promise<void> {
  const toggle = page.locator('.locale-toggle');
  await expect(toggle).toBeVisible();
  const lang = await page.locator('html').getAttribute('lang');
  if (lang !== 'en') await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
}

test('empty slot opens an inline picker and choosing a card places it', async ({ page }) => {
  await page.goto('/mission/1-1-greet');
  await useEnglish(page);
  await expect(page.getByRole('heading', { level: 1, name: /Build your assistant/i })).toBeVisible();

  // Open the Role slot's picker directly (nothing pre-selected in the inventory).
  const roleSlot = page.getByRole('button', { name: 'Role', exact: true });
  await expect(roleSlot).toHaveAttribute('aria-expanded', 'false');
  await roleSlot.click();
  await expect(roleSlot).toHaveAttribute('aria-expanded', 'true');

  // Choose from inside the dropdown (scoped, so we don't hit the inventory chip of the same name).
  await page.locator('.slot-menu').getByRole('button', { name: 'Friendly helper' }).click();

  // The slot now holds the chosen card.
  await expect(page.getByRole('button', { name: /Role: Friendly helper/ })).toBeVisible();

  // And it runs to a pass like any other build.
  await page.getByRole('button', { name: /Run/ }).click();
  await expect(page.locator('.result.pass')).toBeVisible();
});
