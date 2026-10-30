import { defineConfig, devices } from '@playwright/test'

const PORT = 5174

// End-to-end tests of the real UI in Chromium, with a fake WebXR device
// (see e2e/fakeXr.ts). Real AR still needs a phone.
export default defineConfig({
  testDir: 'e2e',
  testMatch: '*.e2e.ts',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    // A phone-sized Chromium, like the Galaxy S23 Ultra.
    ...devices['Pixel 7'],
    baseURL: `http://localhost:${PORT}/ar-ceramic-designer/`,
    // WebGL in software: CI machines have no GPU.
    launchOptions: {
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/ar-ceramic-designer/`,
    reuseExistingServer: !process.env.CI,
    // The tests use the generated vase, bowl and plate, whatever .glb files
    // are in src/features/models/defaults/.
    env: { VITE_MODELS: 'generated' },
  },
})
