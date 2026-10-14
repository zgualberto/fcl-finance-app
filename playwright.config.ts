import { defineConfig, devices } from '@playwright/test';

/**
 * Local-only E2E setup (no CI).
 *
 * The app under test is the Quasar web SPA (`quasar dev` on port 9260),
 * backed by jeep-sqlite + IndexedDB. This covers UI + SQLite logic.
 * It does NOT cover native Android behavior (Capacitor bridges, APK) —
 * that still needs the emulator / `yarn dev:android`.
 *
 * Port 9260 is deliberate: it avoids clashing with `yarn dev:android`
 * (default port 9000) which developers often keep running.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:9260',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'yarn dev --port 9260',
    url: 'http://localhost:9260',
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000,
    stdout: 'pipe',
  },
});
