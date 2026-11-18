import { defineConfig } from '@playwright/test'

const baseURL = process.env.SEED_NG_URL ?? 'http://127.0.0.1:4200'
const channel = process.env.PW_CHANNEL || undefined

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  globalSetup: './tests/global-setup.ts',
  use: {
    baseURL,
    storageState: '.auth/user.json',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 }, channel } },
    // Only tests tagged @mobile run at phone width.
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, channel }, grep: /@mobile/ },
  ],
})
