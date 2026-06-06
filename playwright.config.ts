import { defineConfig, devices } from '@playwright/test';

// E2E config. The app is a relative-path SPA (adapter-static fallback:index.html); `vite preview`
// 404s deep links, so we serve build/ with sirv's --single flag (SPA fallback) instead. The build
// must exist before tests run — `npm run test:e2e` chains `vite build` first.
const PORT = 4178;
const HOST = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: 'tests/e2e',
  // Unit tests live under tests/** and are run by vitest; only pick up *.spec.ts here.
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : [['list']],
  use: {
    baseURL: HOST,
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    // sirv --single serves index.html for unknown paths so client-side deep links (e.g. the
    // dynamic /mission/[id] route) resolve. --quiet keeps test output clean.
    command: `npx sirv build --single --quiet --port ${PORT}`,
    url: HOST,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  }
});
