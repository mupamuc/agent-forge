import { test, expect, type Page } from '@playwright/test';

// AC-13: the player-facing surface must never leak technical artefacts — no raw i18n keys,
// stringified objects, code, or markup. Scan the VISIBLE text of every screen for banned tokens.
const BANNED = ['{', '}', '</', 'function', '[object'];

// Routes that render directly (SPA deep links resolve via sirv --single). The quiz route renders
// for any known world id regardless of unlock state (gating only hides the map CTA, not the page).
const SCREENS: Array<{ name: string; path: string }> = [
  { name: 'home', path: '/' },
  { name: 'campaign', path: '/campaign' },
  { name: 'mission', path: '/mission/1-1-greet' },
  { name: 'quiz', path: '/quiz/world-1' },
  { name: 'sandbox', path: '/sandbox' },
  { name: 'advanced-list', path: '/advanced' },
  { name: 'advanced-level', path: '/advanced/adv-combo-client' },
  { name: 'advanced-chain', path: '/advanced/adv-chain-invoice' },
  { name: 'advanced-tradeoff', path: '/advanced/adv-tradeoff-contract' },
  { name: 'encyclopedia', path: '/encyclopedia' },
  { name: 'encyclopedia-world', path: '/encyclopedia/world-3' }
];

async function visibleText(page: Page): Promise<string> {
  // innerText reflects rendered, visible text (not raw HTML), which is exactly the player surface.
  return page.evaluate(() => document.body.innerText ?? '');
}

for (const screen of SCREENS) {
  test(`no technical tokens on ${screen.name}`, async ({ page }) => {
    await page.goto(screen.path);
    // Wait for the app shell to have hydrated and rendered real content.
    await expect(page.locator('main')).toBeVisible();
    // Give the i18n dictionaries a tick to resolve so we never read the loading "…" placeholder.
    await expect(page.locator('main')).not.toHaveText('…');

    const text = await visibleText(page);
    for (const token of BANNED) {
      expect(text, `screen "${screen.name}" should not contain "${token}"`).not.toContain(token);
    }
  });
}
