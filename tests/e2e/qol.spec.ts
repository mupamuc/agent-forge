import { test, expect, type Page } from '@playwright/test';

// QoL package: home progress + Continue, mission -> theory link, settings progress export/import/reset.

async function useEnglish(page: Page): Promise<void> {
  const toggle = page.locator('.locale-toggle');
  await expect(toggle).toBeVisible();
  const lang = await page.locator('html').getAttribute('lang');
  if (lang !== 'en') await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
}

test('home shows campaign progress and a Continue/Start jump', async ({ page }) => {
  await page.goto('/');
  await useEnglish(page);

  // Fresh game: a progress bar at 0 of the full maximum, and a "Start" jump to the first mission.
  await expect(page.getByRole('progressbar')).toBeVisible();
  const cta = page.locator('.continue');
  await expect(cta).toBeVisible();
  await cta.click();
  await expect(page).toHaveURL(/\/mission\/1-1-greet/);
});

test('a mission links to its world theory in the encyclopedia', async ({ page }) => {
  await page.goto('/mission/1-1-greet');
  await useEnglish(page);

  await page.getByRole('link', { name: /Theory for this world/i }).click();
  await expect(page).toHaveURL(/\/encyclopedia\/world-1/);
  await expect(page.getByText('Role sets the tone')).toBeVisible();
});

test('settings can export a progress code, re-import it, and reset', async ({ page }) => {
  await page.goto('/settings');
  await useEnglish(page);

  // Export code is present and prefixed.
  const code = await page.locator('#prog-export').inputValue();
  expect(code.startsWith('AF1:')).toBe(true);

  // Paste it back into import and load it.
  await page.locator('#prog-import').fill(code);
  await page.getByRole('button', { name: 'Load' }).click();
  await expect(page.getByText('Progress loaded')).toBeVisible();

  // A garbage code is rejected.
  await page.locator('#prog-import').fill('not-a-real-code');
  await page.getByRole('button', { name: 'Load' }).click();
  await expect(page.getByText('Code not recognised')).toBeVisible();

  // Reset asks to confirm, then confirms.
  await page.getByRole('button', { name: 'Reset progress' }).click();
  await page.getByRole('button', { name: 'Yes, reset' }).click();
  await expect(page.getByText('Progress reset')).toBeVisible();
});
