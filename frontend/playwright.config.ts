import { defineConfig, devices } from '@playwright/test'

// End-to-end smoke test against the full stack started with Docker Compose (nginx + Go backend).
// Start it first: `docker compose up --build -d --wait`, then `npm run e2e`.
export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8080',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Optional: use an already installed Chromium instead of `npx playwright install`.
        launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH },
      },
    },
  ],
})
