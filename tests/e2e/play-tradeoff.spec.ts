import { test, expect, type Page } from '@playwright/test';

// Trade-off archetype: there is no single right card — the smart model depends on the task.
// Simple newsletter → the cheap model is the 3-star answer. Legal contract → only the strong model
// is good enough; the cheap one fails. (Scoring contrasts are covered in unit tests; here we drive
// the real UI through the winning builds and the instructive failure.)

async function useEnglish(page: Page): Promise<void> {
  const toggle = page.locator('.locale-toggle');
  await expect(toggle).toBeVisible();
  const lang = await page.locator('html').getAttribute('lang');
  if (lang !== 'en') await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
}

async function pickModel(page: Page, modelName: string): Promise<void> {
  await page.getByRole('button', { name: modelName }).click();
  await page.getByRole('button', { name: 'Model', exact: true }).click();
}

test('simple task: the cheap model wins three stars', async ({ page }) => {
  await page.goto('/advanced/adv-tradeoff-mailout');
  await useEnglish(page);
  await pickModel(page, 'Cheap model');
  await page.getByRole('button', { name: /Run/ }).click();

  const result = page.locator('.result.pass');
  await expect(result).toBeVisible();
  const stars = await result.locator('.star-list .star').allInnerTexts();
  expect(stars.every((g) => g.trim() === '⭐')).toBe(true);
});

test('hard task: the strong model wins three stars', async ({ page }) => {
  await page.goto('/advanced/adv-tradeoff-contract');
  await useEnglish(page);
  await pickModel(page, 'Strong model');
  await page.getByRole('button', { name: /Run/ }).click();

  const result = page.locator('.result.pass');
  await expect(result).toBeVisible();
  const stars = await result.locator('.star-list .star').allInnerTexts();
  expect(stars.every((g) => g.trim() === '⭐')).toBe(true);
});

test('hard task: the cheap model is not good enough and fails', async ({ page }) => {
  await page.goto('/advanced/adv-tradeoff-contract');
  await useEnglish(page);
  await pickModel(page, 'Cheap model');
  await page.getByRole('button', { name: /Run/ }).click();

  await expect(page.locator('.result.fail')).toBeVisible();
  await expect(page.locator('.diagnosis')).toContainText(/strong model/i);
});
