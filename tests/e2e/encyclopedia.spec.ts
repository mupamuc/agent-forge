import { test, expect, type Page } from '@playwright/test';

// The encyclopedia: from the home menu into the index, then into a world's theses (the "book").

async function useEnglish(page: Page): Promise<void> {
  const toggle = page.locator('.locale-toggle');
  await expect(toggle).toBeVisible();
  const lang = await page.locator('html').getAttribute('lang');
  if (lang !== 'en') await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
}

test('home -> encyclopedia -> a world shows its book theses', async ({ page }) => {
  await page.goto('/');
  await useEnglish(page);

  await page.getByRole('link', { name: /Encyclopedia/ }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: /Encyclopedia/i })).toBeVisible();

  // Open the memory world's guide and check a known thesis is rendered.
  await page.getByRole('link', { name: /Give memory and context/i }).click();
  await expect(page.getByRole('heading', { level: 1, name: /Give memory and context/i })).toBeVisible();
  await expect(page.getByText('In-conversation memory')).toBeVisible();
  await expect(page.getByText('Check the reference')).toBeVisible();
});

test('campaign world map links straight to a world guide', async ({ page }) => {
  await page.goto('/campaign');
  await useEnglish(page);

  // The first world's "Encyclopedia" chip opens its guide.
  await page.locator('.enc-link').first().click();
  await expect(page).toHaveURL(/\/encyclopedia\/world-1/);
  await expect(page.getByText('Role sets the tone')).toBeVisible();
});
