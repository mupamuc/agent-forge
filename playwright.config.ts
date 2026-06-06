import { defineConfig, devices } from '@playwright/test';

// E2E config. The app is an SPA (adapter-static fallback:404.html, GitHub Pages convention);
// `vite preview` 404s deep links, so we serve build/ with sirv's --single flag pointed at 404.html
// instead. 404.html uses root-absolute asset paths, so deep links like /mission/[id] boot the SPA
// at any depth (the prerendered index.html uses relative paths and only works at the root). This
// mirrors GitHub Pages, which serves 404.html for unknown paths. The build must exist before tests
// run — `npm run test:e2e` chains `vite build` first.
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
    // sirv --single 404.html serves 404.html for unknown paths so client-side deep links (e.g. the
    // dynamic /mission/[id] route) resolve via the SPA fallback with root-absolute asset paths,
    // matching GitHub Pages. --quiet keeps test output clean.
    command: `npx sirv build --single 404.html --quiet --port ${PORT}`,
    url: HOST,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  }
});
