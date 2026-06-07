import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Accessibility gate: run axe-core on each screen and fail on any serious/critical violation.
// We target WCAG 2.0/2.1 A & AA rule tags (axe has no dedicated 2.2 tag set yet; the 2.2 additions
// we care about — target size, focus — are covered by manual CSS and the other specs).
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const SCREENS: Array<{ name: string; path: string }> = [
  { name: 'home', path: '/' },
  { name: 'campaign', path: '/campaign' },
  { name: 'mission', path: '/mission/1-1-greet' },
  { name: 'quiz', path: '/quiz/world-1' },
  { name: 'sandbox', path: '/sandbox' },
  { name: 'advanced-list', path: '/advanced' },
  { name: 'advanced-level', path: '/advanced/adv-combo-client' },
  { name: 'advanced-chain', path: '/advanced/adv-chain-invoice' }
];

async function waitForApp(page: Page): Promise<void> {
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('main')).not.toHaveText('…');
}

for (const screen of SCREENS) {
  test(`no serious/critical a11y violations on ${screen.name}`, async ({ page }) => {
    await page.goto(screen.path);
    await waitForApp(page);

    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );

    // Surface a readable summary if anything fails.
    const summary = blocking
      .map((v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.length} node(s)`)
      .join('\n');
    expect(blocking, `axe violations on "${screen.name}":\n${summary}`).toEqual([]);
  });
}
